<?php

declare(strict_types=1);

namespace App\Domain\Inventory;

use App\Models\Batch;
use App\Models\InventoryCount;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Opens a stock count: one line per lot that has stock, with the units the system expects in it now.
 * Only one count can be open at a time.
 */
class StartInventoryCount
{
    /**
     * @throws ValidationException when a count is already open
     */
    public function handle(User $user): InventoryCount
    {
        return DB::transaction(function () use ($user): InventoryCount {
            if (InventoryCount::query()->where('status', 'open')->lockForUpdate()->exists()) {
                throw ValidationException::withMessages(['count' => __('inventory.already_open', locale: 'fr')]);
            }

            $count = InventoryCount::query()->create([
                'status' => 'open',
                'started_at' => now(),
                'user_id' => $user->id,
            ]);

            Batch::query()
                ->where('qty_on_hand', '>', 0)
                ->orderBy('id')
                ->select(['id', 'qty_on_hand'])
                ->chunk(500, function ($lots) use ($count): void {
                    $now = now();
                    $count->lines()->insert($lots->map(fn (Batch $lot): array => [
                        'inventory_count_id' => $count->id,
                        'batch_id' => $lot->id,
                        'expected_units' => $lot->qty_on_hand,
                        'counted_units' => null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ])->all());
                });

            return $count;
        });
    }
}
