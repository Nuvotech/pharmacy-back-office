<?php

declare(strict_types=1);

namespace App\Domain\Sync;

use App\Models\Category;
use App\Models\Medicine;
use Illuminate\Database\Eloquent\Collection;
use InvalidArgumentException;

/**
 * One page of the catalogue for a tablet: the medicines changed since its cursor, oldest change first,
 * including deactivated ones so the tablet can remove them. The cursor is opaque to the tablet: it sends
 * back what it was given (see SyncCursor).
 */
class PullCatalogue
{
    public const DEFAULT_LIMIT = 500;

    /**
     * @return array{medicines: Collection<int, Medicine>, categories: Collection<int, Category>, next_cursor: string|null, has_more: bool}
     *
     * @throws InvalidArgumentException when the cursor can't be read
     */
    public function handle(?string $cursor, int $limit = self::DEFAULT_LIMIT): array
    {
        $after = $cursor === null ? null : SyncCursor::decode($cursor);

        $medicines = SyncCursor::apply(Medicine::query()->with('categories:id,slug'), $after)
            ->limit($limit + 1)
            ->get();

        $hasMore = $medicines->count() > $limit;
        $medicines = $medicines->take($limit)->values();
        $last = $medicines->last();

        return [
            'medicines' => $medicines,
            'categories' => Category::query()->orderBy('sort_order')->get(),
            // Nothing new: the tablet keeps its cursor.
            'next_cursor' => $last === null ? $cursor : SyncCursor::encode($last),
            'has_more' => $hasMore,
        ];
    }
}
