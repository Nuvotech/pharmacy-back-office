<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One lot in a stock count: units expected when the count started, and units counted (null until counted).
 *
 * @property int $id
 * @property string $inventory_count_id
 * @property string $batch_id
 * @property int $expected_units
 * @property int|null $counted_units
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read InventoryCount $inventoryCount
 * @property-read Batch $batch
 */
class InventoryCountLine extends Model
{
    /**
     * @var list<string>
     */
    protected $guarded = [];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expected_units' => 'integer',
            'counted_units' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<InventoryCount, $this>
     */
    public function inventoryCount(): BelongsTo
    {
        return $this->belongsTo(InventoryCount::class);
    }

    /**
     * @return BelongsTo<Batch, $this>
     */
    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class);
    }
}
