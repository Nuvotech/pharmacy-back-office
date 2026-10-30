<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Receptions\ShortDated;
use App\Models\Reception;
use App\Models\ReceptionLine;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A reception with its lines, for the back office and the tablet. Amounts are decimal strings in the
 * invoice currency; quantities are packs (boxes) and units.
 *
 * @mixin Reception
 */
class ReceptionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'supplier_id' => $this->supplier_id,
            'invoice_ref' => $this->invoice_ref,
            'received_on' => $this->received_at->toDateString(),
            'currency' => $this->currency->value,
            'total_cost' => $this->total_cost,
            'exchange_rate' => $this->exchange_rate,
            'validated_at' => $this->validated_at?->utc()->toIso8601ZuluString(),
            'updated_at' => $this->updated_at?->utc()->toIso8601ZuluString(),
            'lines' => $this->lines->map(fn (ReceptionLine $line): array => [
                'id' => $line->id,
                'medicine_id' => $line->medicine_id,
                'medicine_name' => $line->medicine->name,
                'dci' => $line->medicine->dci,
                'units_per_pack' => max(1, $line->units_per_pack ?? $line->medicine->units_per_pack),
                'lot_number' => $line->lot_number,
                'expiry' => $line->expiry_date->format('Y-m'),
                'packs' => $line->packs,
                'units' => $line->packs * max(1, $line->units_per_pack ?? $line->medicine->units_per_pack),
                'cost_per_pack' => bcadd($line->cost_per_pack, '0', 2),
                'is_short_dated' => ShortDated::isShortDated($line->expiry_date, $this->received_at),
            ])->values(),
        ];
    }
}
