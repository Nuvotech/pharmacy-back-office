<?php

declare(strict_types=1);

namespace App\Domain\Receptions;

use App\Enums\InvoiceCurrency;
use App\Enums\ReceptionStatus;
use App\Models\Reception;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * "Enregistrer le brouillon": saves the delivery as typed so far. A draft creates no lot and changes no
 * stock. Its lines are replaced as a whole on each save.
 *
 * @phpstan-type ReceptionLineInput array{medicine_id: string, lot_number: string, expiry: string, packs: int, units_per_pack: int, cost_per_pack: numeric-string}
 * @phpstan-type ReceptionInput array{id?: string|null, supplier_id?: string|null, invoice_ref?: string|null, received_on: string, currency: string, lines: list<ReceptionLineInput>}
 */
class SaveReceptionDraft
{
    /**
     * @param  ReceptionInput  $data  `expiry` is "YYYY-MM"; `units_per_pack` is the box size as delivered;
     *                                `cost_per_pack` is in the invoice currency
     *
     * @throws ValidationException when the reception was already validated
     */
    public function handle(User $user, array $data): Reception
    {
        return DB::transaction(function () use ($user, $data): Reception {
            $reception = $this->findOrNew($data['id'] ?? null);
            $currency = InvoiceCurrency::from($data['currency']);

            $reception->fill([
                'status' => ReceptionStatus::Draft,
                'supplier_id' => $data['supplier_id'] ?? null,
                'invoice_ref' => isset($data['invoice_ref']) ? trim($data['invoice_ref']) : null,
                'currency' => $currency,
                'received_at' => Carbon::parse($data['received_on'])->startOfDay(),
                'total_cost' => $this->invoiceTotal($data['lines']),
                'user_id' => $user->id,
            ]);
            $reception->save();

            $reception->lines()->delete();
            foreach ($data['lines'] as $position => $line) {
                $reception->lines()->create([
                    'medicine_id' => $line['medicine_id'],
                    'lot_number' => mb_strtoupper(trim($line['lot_number'])),
                    'expiry_date' => Carbon::createFromFormat('!Y-m', $line['expiry'])?->endOfMonth()->toDateString(),
                    'packs' => $line['packs'],
                    'units_per_pack' => $line['units_per_pack'],
                    'cost_per_pack' => $line['cost_per_pack'],
                    'position' => $position,
                ]);
            }

            return $reception->load('lines.medicine');
        });
    }

    private function findOrNew(?string $id): Reception
    {
        if ($id === null) {
            return new Reception;
        }

        $reception = Reception::query()->lockForUpdate()->find($id);

        if ($reception === null) {
            $reception = new Reception;
            $reception->id = $id;

            return $reception;
        }

        if ($reception->status !== ReceptionStatus::Draft) {
            throw ValidationException::withMessages([
                'id' => __('receptions.already_validated', locale: 'fr'),
            ]);
        }

        return $reception;
    }

    /**
     * Sum of packs × cost per pack, in the invoice currency, without floats.
     *
     * @param  list<ReceptionLineInput>  $lines
     * @return numeric-string
     */
    private function invoiceTotal(array $lines): string
    {
        $total = '0';
        foreach ($lines as $line) {
            $total = bcadd($total, bcmul((string) $line['packs'], $line['cost_per_pack'], 4), 4);
        }

        return bcadd($total, '0', 2);
    }
}
