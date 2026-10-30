<?php

declare(strict_types=1);

namespace App\Domain\Sync;

use App\Domain\Sales\RecordSale;
use App\Models\Batch;
use App\Models\Device;
use App\Models\Medicine;
use App\Models\Sale;
use App\Models\SyncEvent;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Throwable;

/**
 * `POST /api/v1/sync/push`: applies a batch of events from a device, each in its own transaction and
 * recorded in `sync_events`. An event id seen before is acknowledged and skipped, so a batch re-sent after
 * a dropped connection never sells the stock twice. One bad event does not stop the others.
 *
 * @phpstan-import-type SaleInput from RecordSale
 *
 * @phpstan-type EventInput array{id: string, type: string, created_at: string, payload: array<string, mixed>}
 * @phpstan-type EventResult array{id: string, status: 'applied'|'duplicate'|'failed', error: string|null}
 */
class IngestSyncBatch
{
    public function __construct(private readonly RecordSale $recordSale) {}

    /**
     * @param  list<EventInput>  $events
     * @return array{results: list<EventResult>, batches: list<array{id: string, qty_on_hand: int}>}
     */
    public function handle(Device $device, array $events): array
    {
        $results = [];
        $touchedLots = [];

        foreach ($events as $event) {
            if (SyncEvent::query()->whereKey($event['id'])->exists()) {
                $results[] = ['id' => $event['id'], 'status' => 'duplicate', 'error' => null];

                continue;
            }

            try {
                $lots = DB::transaction(function () use ($device, $event): array {
                    $lots = $this->apply($device, $event);
                    $this->log($device, $event, 'applied', null);

                    return $lots;
                });
                array_push($touchedLots, ...$lots);
                $results[] = ['id' => $event['id'], 'status' => 'applied', 'error' => null];
            } catch (InvalidSyncEvent $exception) {
                $this->log($device, $event, 'failed', $exception->getMessage());
                $results[] = ['id' => $event['id'], 'status' => 'failed', 'error' => $exception->getMessage()];
            } catch (Throwable $exception) {
                report($exception);
                // Not logged: an unexpected error (e.g. the database) may pass on the next push.
                $results[] = ['id' => $event['id'], 'status' => 'failed', 'error' => 'server_error'];
            }
        }

        return [
            'results' => $results,
            'batches' => array_values(Batch::query()
                ->whereKey(array_values(array_unique($touchedLots)))
                ->get(['id', 'qty_on_hand'])
                ->map(fn (Batch $lot): array => ['id' => $lot->id, 'qty_on_hand' => $lot->qty_on_hand])
                ->all()),
        ];
    }

    /**
     * @param  EventInput  $event
     * @return list<string> lots changed
     *
     * @throws InvalidSyncEvent
     */
    private function apply(Device $device, array $event): array
    {
        if ($event['type'] !== 'sale_created') {
            throw new InvalidSyncEvent('unknown_event_type');
        }

        $sale = $this->validSale($event['payload']);

        // The sale may already exist if an earlier push applied it under another event id.
        if (Sale::query()->whereKey($sale['id'])->exists()) {
            return [];
        }

        return $this->recordSale->handle($sale, $device);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return SaleInput
     *
     * @throws InvalidSyncEvent
     */
    private function validSale(array $payload): array
    {
        $validator = Validator::make($payload, [
            'sale' => ['required', 'array'],
            'sale.id' => ['required', 'uuid'],
            'sale.receipt_no' => ['required', 'string', 'max:30'],
            'sale.user_id' => ['nullable', 'integer', Rule::exists(User::class, 'id')],
            'sale.sold_at' => ['required', 'date'],
            'sale.total' => ['required', 'numeric', 'min:0'],
            'sale.currency_paid' => ['required', Rule::in(['USD', 'CDF'])],
            'sale.exchange_rate' => ['required', 'numeric', 'gt:0'],
            'sale.amount_paid' => ['required', 'numeric', 'min:0'],
            'sale.change_given' => ['required', 'numeric', 'min:0'],
            'sale.payment_method' => ['required', Rule::in(['cash', 'mobile_money'])],
            'sale.payment_ref' => ['nullable', 'string', 'max:100'],
            'sale.prescriber' => ['nullable', 'string', 'max:255'],
            'sale.patient_name' => ['nullable', 'string', 'max:255'],
            'sale.lines' => ['required', 'array', 'min:1', 'max:200'],
            'sale.lines.*.medicine_id' => ['required', 'uuid', Rule::exists(Medicine::class, 'id')],
            'sale.lines.*.sell_mode' => ['required', Rule::in(['pack', 'unit'])],
            'sale.lines.*.quantity' => ['required', 'integer', 'min:1'],
            'sale.lines.*.units_per_pack' => ['required', 'integer', 'min:1'],
            'sale.lines.*.unit_price' => ['required', 'numeric', 'min:0'],
            'sale.lines.*.lots' => ['required', 'array', 'min:1'],
            'sale.lines.*.lots.*.batch_id' => ['required', 'uuid', Rule::exists(Batch::class, 'id')],
            'sale.lines.*.lots.*.units' => ['required', 'integer', 'min:1'],
        ]);

        if ($validator->fails()) {
            throw new InvalidSyncEvent('invalid_payload: '.$validator->errors()->keys()[0]);
        }

        /** @var array{sale: array<string, mixed>} $valid */
        $valid = $validator->validated();
        $sale = $valid['sale'];

        if (Sale::query()->where('receipt_no', $sale['receipt_no'])->whereKeyNot($sale['id'])->exists()) {
            throw new InvalidSyncEvent('receipt_no_taken');
        }

        /** @var SaleInput $typed */
        $typed = [
            'id' => (string) $sale['id'],
            'receipt_no' => (string) $sale['receipt_no'],
            'user_id' => isset($sale['user_id']) ? (int) $sale['user_id'] : null,
            'sold_at' => (string) $sale['sold_at'],
            'total' => (string) $sale['total'],
            'currency_paid' => (string) $sale['currency_paid'],
            'exchange_rate' => (string) $sale['exchange_rate'],
            'amount_paid' => (string) $sale['amount_paid'],
            'change_given' => (string) $sale['change_given'],
            'payment_method' => (string) $sale['payment_method'],
            'payment_ref' => isset($sale['payment_ref']) ? (string) $sale['payment_ref'] : null,
            'prescriber' => isset($sale['prescriber']) ? (string) $sale['prescriber'] : null,
            'patient_name' => isset($sale['patient_name']) ? (string) $sale['patient_name'] : null,
            'lines' => $sale['lines'],
        ];

        return $typed;
    }

    /**
     * @param  EventInput  $event
     */
    private function log(Device $device, array $event, string $status, ?string $error): void
    {
        SyncEvent::query()->create([
            'id' => $event['id'],
            'device_id' => $device->id,
            'type' => $event['type'],
            'payload' => $event['payload'],
            'status' => $status,
            'error' => $error,
            'device_created_at' => Carbon::parse($event['created_at'])->utc(),
            'received_at' => now(),
        ]);
    }
}
