<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A lot. `qty_on_hand` (units) is a cache of its stock movements and only the stock ledger writes it.
 * `purchase_price_unit` is in the base currency.
 *
 * @property string $id
 * @property string $medicine_id
 * @property string|null $reception_id
 * @property string|null $supplier_id
 * @property string $lot_number
 * @property Carbon $expiry_date
 * @property numeric-string $purchase_price_unit
 * @property int $qty_received
 * @property int $qty_on_hand
 * @property Carbon $received_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Batch extends Model
{
    use HasUuids;

    /**
     * qty_on_hand is left out on purpose: it changes only through RecordStockMovement.
     *
     * @var list<string>
     */
    protected $fillable = [
        'medicine_id', 'reception_id', 'supplier_id', 'lot_number', 'expiry_date', 'purchase_price_unit',
        'qty_received', 'received_at',
    ];

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'qty_on_hand' => 0,
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expiry_date' => 'date',
            'purchase_price_unit' => 'decimal:4',
            'qty_received' => 'integer',
            'qty_on_hand' => 'integer',
            'received_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Medicine, $this>
     */
    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }

    /**
     * @return HasMany<StockMovement, $this>
     */
    public function movements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }
}
