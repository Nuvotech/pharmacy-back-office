<?php

declare(strict_types=1);

namespace App\Domain\Stock;

use App\Enums\MovementType;
use App\Models\Batch;
use App\Models\StockMovement;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * The stock ledger: the only code that changes a lot's quantity. Each change appends a stock movement and
 * updates `batches.qty_on_hand` in the same transaction.
 */
class RecordStockMovement
{
    /**
     * @param  int  $quantity  units, positive for stock in and negative for stock out
     * @param  array{type: string, id: string}|null  $reference  what caused the change, e.g. a reception
     */
    public function handle(
        Batch $batch,
        MovementType $type,
        int $quantity,
        ?User $user = null,
        ?array $reference = null,
        ?string $reason = null,
        ?CarbonInterface $occurredAt = null,
    ): StockMovement {
        if ($quantity === 0) {
            throw new InvalidArgumentException('A stock movement cannot be zero.');
        }

        return DB::transaction(function () use ($batch, $type, $quantity, $user, $reference, $reason, $occurredAt): StockMovement {
            Batch::query()->whereKey($batch->id)->lockForUpdate()->firstOrFail();

            $movement = StockMovement::query()->create([
                'batch_id' => $batch->id,
                'medicine_id' => $batch->medicine_id,
                'type' => $type,
                'qty_units' => $quantity,
                'reason' => $reason,
                'reference_type' => $reference['type'] ?? null,
                'reference_id' => $reference['id'] ?? null,
                'user_id' => $user?->id,
                'occurred_at' => $occurredAt ?? now(),
            ]);

            // Also bumps updated_at, which is what sends the lot to the tablets on their next pull.
            Batch::query()->whereKey($batch->id)->increment('qty_on_hand', $quantity);
            $batch->refresh();

            return $movement;
        });
    }
}
