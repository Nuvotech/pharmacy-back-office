<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * The part of a sale line taken from one lot (FEFO on the tablet). `quantity` is packs or units per
 * `sell_mode`; `qty_units` is always units. Prices in CDF.
 *
 * @property string $id
 * @property string $sale_id
 * @property string $medicine_id
 * @property string $batch_id
 * @property string $sell_mode
 * @property int $quantity
 * @property int $qty_units
 * @property numeric-string $unit_price
 * @property numeric-string $line_total
 * @property int $qty_returned_units
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class SaleItem extends Model
{
    use HasUuids;

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
            'quantity' => 'integer',
            'qty_units' => 'integer',
            'unit_price' => 'decimal:2',
            'line_total' => 'decimal:2',
            'qty_returned_units' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Sale, $this>
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }
}
