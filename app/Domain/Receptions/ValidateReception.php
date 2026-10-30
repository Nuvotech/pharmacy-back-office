<?php

declare(strict_types=1);

namespace App\Domain\Receptions;

use App\Domain\Stock\RecordStockMovement;
use App\Enums\InvoiceCurrency;
use App\Enums\MovementType;
use App\Enums\ReceptionStatus;
use App\Models\Batch;
use App\Models\ExchangeRate;
use App\Models\Reception;
use App\Models\ReceptionLine;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * "Valider la réception": saves the delivery, then turns each line into a lot and records its units in the
 * stock ledger. A box size that differs from the medicine sheet is saved on the medicine. Tablets get the
 * new lots on their next pull.
 *
 * @phpstan-import-type ReceptionInput from SaveReceptionDraft
 */
class ValidateReception
{
    public function __construct(
        private readonly SaveReceptionDraft $saveDraft,
        private readonly RecordStockMovement $recordStockMovement,
    ) {}

    /**
     * Validating a reception that is already validated returns it unchanged, so a retry after a lost
     * response never receives the stock twice.
     *
     * @param  ReceptionInput  $data
     * @param  bool  $shortDatedConfirmed  the user confirmed the lots expiring in under 6 months
     *
     * @throws ValidationException
     */
    public function handle(User $user, array $data, bool $shortDatedConfirmed): Reception
    {
        return DB::transaction(function () use ($user, $data, $shortDatedConfirmed): Reception {
            $existing = isset($data['id']) ? Reception::query()->lockForUpdate()->find($data['id']) : null;
            if ($existing?->status === ReceptionStatus::Validated) {
                return $existing->load('lines.medicine');
            }

            $reception = $this->saveDraft->handle($user, $data);

            $this->ensureShortDatedLotsConfirmed($reception, $shortDatedConfirmed);
            $exchangeRate = $this->exchangeRate($reception);

            foreach ($reception->lines as $line) {
                $this->receiveLine($reception, $line, $exchangeRate, $user);
            }

            $reception->forceFill([
                'status' => ReceptionStatus::Validated,
                'exchange_rate' => $reception->currency === InvoiceCurrency::Usd ? $exchangeRate : null,
                'validated_at' => now(),
            ])->save();

            return $reception;
        });
    }

    private function ensureShortDatedLotsConfirmed(Reception $reception, bool $isConfirmed): void
    {
        $hasShortDated = $reception->lines->contains(
            fn (ReceptionLine $line): bool => ShortDated::isShortDated($line->expiry_date, $reception->received_at),
        );

        if ($hasShortDated && ! $isConfirmed) {
            throw ValidationException::withMessages([
                'short_dated_confirmed' => __('receptions.short_dated_not_confirmed', locale: 'fr'),
            ]);
        }
    }

    /**
     * CDF for one unit of the invoice currency: 1 for a CDF invoice, the rate in force on the reception
     * date for a USD one.
     *
     * @return numeric-string
     */
    private function exchangeRate(Reception $reception): string
    {
        if ($reception->currency === InvoiceCurrency::Cdf) {
            return '1';
        }

        $rate = ExchangeRate::query()->inForceOn($reception->received_at->toDateString())->value('usd_to_cdf');

        if (! is_numeric($rate)) {
            throw ValidationException::withMessages([
                'currency' => __('receptions.exchange_rate_missing', locale: 'fr'),
            ]);
        }

        return (string) $rate;
    }

    /**
     * @param  numeric-string  $exchangeRate
     */
    private function receiveLine(Reception $reception, ReceptionLine $line, string $exchangeRate, User $user): void
    {
        $unitsPerPack = max(1, $line->units_per_pack ?? $line->medicine->units_per_pack);
        $units = $line->packs * $unitsPerPack;

        // The box size typed at reception corrects the medicine sheet, so the counter sells by the real box.
        if ($line->medicine->units_per_pack !== $unitsPerPack) {
            $line->medicine->update(['units_per_pack' => $unitsPerPack]);
        }

        $batch = Batch::query()->create([
            'medicine_id' => $line->medicine_id,
            'reception_id' => $reception->id,
            'supplier_id' => $reception->supplier_id,
            'lot_number' => $line->lot_number,
            'expiry_date' => $line->expiry_date,
            'purchase_price_unit' => bcdiv(bcmul($line->cost_per_pack, $exchangeRate, 8), (string) $unitsPerPack, 4),
            'qty_received' => $units,
            'received_at' => $reception->received_at,
        ]);

        $this->recordStockMovement->handle(
            $batch,
            MovementType::Reception,
            $units,
            $user,
            ['type' => 'reception', 'id' => $reception->id],
            occurredAt: $reception->received_at,
        );
    }
}
