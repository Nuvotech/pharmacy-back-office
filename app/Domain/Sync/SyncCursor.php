<?php

declare(strict_types=1);

namespace App\Domain\Sync;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use InvalidArgumentException;

/**
 * The position in a sync pull: the (updated_at, id) of the last record sent, as an opaque base64url string.
 * Records are read in (updated_at, id) order, so rows changed in the same second are neither skipped nor
 * sent twice.
 */
final class SyncCursor
{
    public static function encode(Model $record): string
    {
        $updatedAt = $record->getAttribute('updated_at') ?? Carbon::createFromTimestamp(0);

        return rtrim(strtr(base64_encode((string) json_encode([
            'updated_at' => Carbon::parse($updatedAt)->format('Y-m-d H:i:s'),
            'id' => (string) $record->getKey(),
        ])), '+/', '-_'), '=');
    }

    /**
     * @return array{updated_at: string, id: string}
     *
     * @throws InvalidArgumentException when the cursor can't be read
     */
    public static function decode(string $cursor): array
    {
        $json = base64_decode(strtr($cursor, '-_', '+/'), true);
        $position = $json === false ? null : json_decode($json, true);

        if (
            ! is_array($position)
            || ! is_string($position['updated_at'] ?? null)
            || ! is_string($position['id'] ?? null)
            || preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $position['updated_at']) !== 1
        ) {
            throw new InvalidArgumentException('Invalid sync cursor.');
        }

        return ['updated_at' => $position['updated_at'], 'id' => $position['id']];
    }

    /**
     * Keeps the records after the cursor position, in pull order.
     *
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $query
     * @param  array{updated_at: string, id: string}|null  $after
     * @return Builder<TModel>
     */
    public static function apply(Builder $query, ?array $after): Builder
    {
        return $query
            ->when($after, fn (Builder $query, array $position) => $query->where(
                fn (Builder $query) => $query
                    ->where('updated_at', '>', $position['updated_at'])
                    ->orWhere(fn (Builder $query) => $query
                        ->where('updated_at', $position['updated_at'])
                        ->where('id', '>', $position['id'])),
            ))
            ->orderBy('updated_at')
            ->orderBy('id');
    }
}
