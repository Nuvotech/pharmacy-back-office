<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Batch;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A lot as the tablet stores it. `qty_on_hand` is in units; `expiry_date` is the last day the lot is good.
 *
 * @mixin Batch
 */
class SyncBatchResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'medicine_id' => $this->medicine_id,
            'lot_number' => $this->lot_number,
            'expiry_date' => $this->expiry_date->toDateString(),
            'qty_on_hand' => $this->qty_on_hand,
            'received_at' => $this->received_at->utc()->toIso8601ZuluString(),
            'updated_at' => $this->updated_at?->utc()->toIso8601ZuluString(),
        ];
    }
}
