<?php

declare(strict_types=1);

namespace App\Domain\Sync;

use App\Models\Category;
use App\Models\Medicine;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use InvalidArgumentException;

/**
 * One page of the catalogue for a tablet: the medicines changed since its cursor, oldest change first,
 * including deactivated ones so the tablet can remove them. The cursor is opaque to the tablet: it sends
 * back what it was given. Pages are ordered by (updated_at, id), so medicines changed in the same second
 * are neither skipped nor sent twice.
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
        $after = $cursor === null ? null : $this->decode($cursor);

        $medicines = Medicine::query()
            ->with('categories:id,slug')
            ->when($after, fn (Builder $query, array $position) => $query->where(
                fn (Builder $query) => $query
                    ->where('updated_at', '>', $position['updated_at'])
                    ->orWhere(fn (Builder $query) => $query
                        ->where('updated_at', $position['updated_at'])
                        ->where('id', '>', $position['id'])),
            ))
            ->orderBy('updated_at')
            ->orderBy('id')
            ->limit($limit + 1)
            ->get();

        $hasMore = $medicines->count() > $limit;
        $medicines = $medicines->take($limit)->values();
        $last = $medicines->last();

        return [
            'medicines' => $medicines,
            'categories' => Category::query()->orderBy('sort_order')->get(),
            // Nothing new: the tablet keeps its cursor.
            'next_cursor' => $last === null ? $cursor : $this->encode($last),
            'has_more' => $hasMore,
        ];
    }

    private function encode(Medicine $medicine): string
    {
        $updatedAt = $medicine->updated_at ?? Carbon::createFromTimestamp(0);

        return rtrim(strtr(base64_encode((string) json_encode([
            'updated_at' => $updatedAt->format('Y-m-d H:i:s'),
            'id' => $medicine->id,
        ])), '+/', '-_'), '=');
    }

    /**
     * @return array{updated_at: string, id: string}
     */
    private function decode(string $cursor): array
    {
        $json = base64_decode(strtr($cursor, '-_', '+/'), true);
        $position = $json === false ? null : json_decode($json, true);

        if (
            ! is_array($position)
            || ! is_string($position['updated_at'] ?? null)
            || ! is_string($position['id'] ?? null)
            || preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $position['updated_at']) !== 1
        ) {
            throw new InvalidArgumentException('Invalid catalogue cursor.');
        }

        return ['updated_at' => $position['updated_at'], 'id' => $position['id']];
    }
}
