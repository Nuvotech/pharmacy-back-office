<?php

declare(strict_types=1);

namespace App\Domain\Sales;

use App\Domain\Stock\RecordStockMovement;
use App\Enums\MovementType;
use App\Models\Batch;
use App\Models\Device;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockDiscrepancy;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Records a sale made on a tablet and takes its units out of stock. Each line arrives with the lots the
 * tablet took it from (FEFO). When the server has fewer units in a lot than the tablet sold from it, the
 * shortfall moves to the next FEFO lot of the same medicine; whatever no lot can cover becomes a stock
 * discrepancy for the pharmacist. Lots are locked while they are read and changed.
 *
 * @phpstan-type SaleLineInput array{medicine_id: string, sell_mode: string, quantity: int, units_per_pack: int, unit_price: numeric-string, lots: list<array{batch_id: string, units: int}>}
 * @phpstan-type SaleInput array{id: string, receipt_no: string, user_id: int|null, sold_at: string, total: numeric-string, currency_paid: string, exchange_rate: numeric-string, amount_paid: numeric-string, change_given: numeric-string, payment_method: string, payment_ref: string|null, prescriber: string|null, patient_name: string|null, lines: list<SaleLineInput>}
 */
class RecordSale
{
    public function __construct(private readonly RecordStockMovement $recordStockMovement) {}

    /**
     * @param  SaleInput  $data  amounts in CDF except `amount_paid` (in `currency_paid`)
     * @return list<string> ids of the lots whose quantity changed
     */
    public function handle(array $data, Device $device): array
    {
        return DB::transaction(function () use ($data, $device): array {
            $sale = Sale::query()->create([
                'id' => $data['id'],
                'receipt_no' => $data['receipt_no'],
                'device_id' => $device->id,
                'user_id' => $data['user_id'],
                'total' => $data['total'],
                'currency_paid' => $data['currency_paid'],
                'exchange_rate' => $data['exchange_rate'],
                'amount_paid' => $data['amount_paid'],
                'change_given' => $data['change_given'],
                'payment_method' => $data['payment_method'],
                'payment_ref' => $data['payment_ref'],
                'prescriber' => $data['prescriber'],
                'patient_name' => $data['patient_name'],
                'sold_at' => Carbon::parse($data['sold_at'])->utc(),
                'synced_at' => now(),
            ]);

            $touchedLots = [];
            foreach ($data['lines'] as $line) {
                foreach ($line['lots'] as $lot) {
                    $item = $this->createItem($sale, $line, $lot);
                    array_push($touchedLots, ...$this->takeFromStock($sale, $item));
                }
            }

            return array_values(array_unique($touchedLots));
        });
    }

    /**
     * @param  SaleLineInput  $line
     * @param  array{batch_id: string, units: int}  $lot
     */
    private function createItem(Sale $sale, array $line, array $lot): SaleItem
    {
        $quantity = $line['sell_mode'] === 'pack'
            ? intdiv($lot['units'], max(1, $line['units_per_pack']))
            : $lot['units'];

        return SaleItem::query()->create([
            'sale_id' => $sale->id,
            'medicine_id' => $line['medicine_id'],
            'batch_id' => $lot['batch_id'],
            'sell_mode' => $line['sell_mode'],
            'quantity' => $quantity,
            'qty_units' => $lot['units'],
            'unit_price' => $line['unit_price'],
            'line_total' => bcmul((string) $quantity, $line['unit_price'], 2),
        ]);
    }

    /**
     * Takes the item's units from its lot, then from the next FEFO lots, and records any shortfall.
     *
     * @return list<string> lots changed
     */
    private function takeFromStock(Sale $sale, SaleItem $item): array
    {
        $remaining = $item->qty_units;
        $touched = [];
        $reference = ['type' => 'sale', 'id' => $sale->id];

        $soldLot = Batch::query()->whereKey($item->batch_id)->lockForUpdate()->firstOrFail();
        $taken = min($remaining, max(0, $soldLot->qty_on_hand));
        if ($taken > 0) {
            $this->recordStockMovement->handle($soldLot, MovementType::Sale, -$taken, null, $reference, occurredAt: $sale->sold_at);
            $remaining -= $taken;
            $touched[] = $soldLot->id;
        }

        if ($remaining > 0) {
            $otherLots = Batch::query()
                ->where('medicine_id', $item->medicine_id)
                ->whereKeyNot($soldLot->id)
                ->where('qty_on_hand', '>', 0)
                ->whereDate('expiry_date', '>', $sale->sold_at->toDateString())
                ->orderBy('expiry_date')
                ->orderBy('received_at')
                ->lockForUpdate()
                ->get();

            foreach ($otherLots as $lot) {
                $taken = min($remaining, $lot->qty_on_hand);
                $this->recordStockMovement->handle(
                    $lot,
                    MovementType::SyncReallocation,
                    -$taken,
                    null,
                    $reference,
                    'Lot vendu sur la tablette épuisé sur le serveur',
                    $sale->sold_at,
                );
                $remaining -= $taken;
                $touched[] = $lot->id;

                if ($remaining === 0) {
                    break;
                }
            }
        }

        if ($remaining > 0) {
            StockDiscrepancy::query()->create([
                'sale_item_id' => $item->id,
                'medicine_id' => $item->medicine_id,
                'batch_id' => $soldLot->id,
                'qty_short_units' => $remaining,
                'status' => 'open',
            ]);
        }

        return $touched;
    }
}
