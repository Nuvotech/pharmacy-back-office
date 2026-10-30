<?php

declare(strict_types=1);

namespace App\Domain\Inventory;

use App\Models\InventoryCountLine;
use Illuminate\Validation\ValidationException;

/**
 * Saves the units counted in one lot (null clears it back to "à compter"). Only an open count can change.
 */
class RecordCountedUnits
{
    /**
     * @throws ValidationException when the count is closed
     */
    public function handle(InventoryCountLine $line, ?int $countedUnits): InventoryCountLine
    {
        if ($line->inventoryCount->status !== 'open') {
            throw ValidationException::withMessages(['counted_units' => __('inventory.not_open', locale: 'fr')]);
        }

        $line->update(['counted_units' => $countedUnits]);

        return $line;
    }
}
