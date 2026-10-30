<?php

declare(strict_types=1);

namespace App\Domain\Sync;

use App\Models\Batch;
use Illuminate\Database\Eloquent\Collection;
use InvalidArgumentException;

/**
 * One page of stock for a tablet: the lots changed since its cursor, oldest change first. Every stock
 * movement touches its lot (RecordStockMovement), so a reception, sale or correction re-sends the lot with
 * its new quantity. Empty and expired lots are sent too, so the tablet can drop them.
 */
class PullStock
{
    public const DEFAULT_LIMIT = 500;

    /**
     * @return array{batches: Collection<int, Batch>, next_cursor: string|null, has_more: bool}
     *
     * @throws InvalidArgumentException when the cursor can't be read
     */
    public function handle(?string $cursor, int $limit = self::DEFAULT_LIMIT): array
    {
        $after = $cursor === null ? null : SyncCursor::decode($cursor);

        $batches = SyncCursor::apply(Batch::query(), $after)
            ->limit($limit + 1)
            ->get();

        $hasMore = $batches->count() > $limit;
        $batches = $batches->take($limit)->values();
        $last = $batches->last();

        return [
            'batches' => $batches,
            // Nothing new: the tablet keeps its cursor.
            'next_cursor' => $last === null ? $cursor : SyncCursor::encode($last),
            'has_more' => $hasMore,
        ];
    }
}
