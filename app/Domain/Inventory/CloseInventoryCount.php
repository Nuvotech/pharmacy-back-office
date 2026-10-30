<?php

declare(strict_types=1);

namespace App\Domain\Inventory;

use App\Domain\Stock\RecordStockMovement;
use App\Enums\MovementType;
use App\Models\InventoryCount;
use App\Models\InventoryCountLine;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * "Clôturer l'inventaire": every counted lot whose count differs from what was expected gets an
 * `inventory_correction` movement of (counted − expected), signed by the user who closes. Lots not
 * counted keep their quantity.
 */
class CloseInventoryCount
{
    public function __construct(private readonly RecordStockMovement $recordStockMovement) {}

    /**
     * @return int number of corrections posted
     *
     * @throws ValidationException when the count is not open
     */
    public function handle(InventoryCount $count, User $user): int
    {
        return DB::transaction(function () use ($count, $user): int {
            $count = InventoryCount::query()->whereKey($count->id)->lockForUpdate()->firstOrFail();

            if ($count->status !== 'open') {
                throw ValidationException::withMessages(['count' => __('inventory.not_open', locale: 'fr')]);
            }

            $reason = __('inventory.correction_reason', ['date' => $count->started_at->format('d/m/Y')], 'fr');
            $corrections = 0;

            $count->lines()
                ->whereNotNull('counted_units')
                ->whereColumn('counted_units', '!=', 'expected_units')
                ->with('batch')
                ->each(function (InventoryCountLine $line) use ($count, $user, $reason, &$corrections): void {
                    $this->recordStockMovement->handle(
                        $line->batch,
                        MovementType::InventoryCorrection,
                        (int) $line->counted_units - $line->expected_units,
                        $user,
                        ['type' => 'inventory_count', 'id' => $count->id],
                        $reason,
                    );
                    $corrections++;
                });

            $count->forceFill(['status' => 'closed', 'closed_at' => now()])->save();

            return $corrections;
        });
    }
}
