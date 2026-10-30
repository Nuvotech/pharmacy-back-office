<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\StockStatus;
use Database\Factories\MedicineFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Carbon;

/**
 * Quantities in the smallest unit; prices in the base currency (settings.base_currency).
 *
 * @property string $id
 * @property string $name
 * @property string|null $dci
 * @property string|null $dosage
 * @property string|null $form
 * @property string|null $barcode
 * @property string|null $image_path
 * @property int $units_per_pack
 * @property string $sale_price_pack
 * @property string|null $sale_price_unit
 * @property int $min_stock_units
 * @property bool $prescription_required
 * @property bool $is_active
 * @property int|null $sellable_units only when loaded with withSellableUnits()
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'name', 'dci', 'dosage', 'form', 'barcode', 'image_path', 'units_per_pack', 'sale_price_pack',
    'sale_price_unit', 'min_stock_units', 'prescription_required', 'is_active',
])]
class Medicine extends Model
{
    /** @use HasFactory<MedicineFactory> */
    use HasFactory, HasUuids;

    /**
     * Units in this medicine's lots that have not expired; bind today's date (Y-m-d) to the placeholder.
     */
    private const SELLABLE_UNITS_SQL = '(SELECT COALESCE(SUM(batches.qty_on_hand), 0) FROM batches'
        .' WHERE batches.medicine_id = medicines.id AND batches.expiry_date > ?)';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'units_per_pack' => 'integer',
            'sale_price_pack' => 'decimal:2',
            'sale_price_unit' => 'decimal:2',
            'min_stock_units' => 'integer',
            'prescription_required' => 'boolean',
            'is_active' => 'boolean',
            'sellable_units' => 'integer',
        ];
    }

    /**
     * @return BelongsToMany<Category, $this>
     */
    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class)->orderBy('sort_order');
    }

    /**
     * Adds `sellable_units`: units in this medicine's lots that have not expired.
     *
     * @param  Builder<Medicine>  $query
     */
    #[Scope]
    protected function withSellableUnits(Builder $query): void
    {
        if ($query->getQuery()->columns === null) {
            $query->select('medicines.*');
        }

        $query->selectRaw(self::SELLABLE_UNITS_SQL.' AS sellable_units', [self::today()]);
    }

    /**
     * Keeps the medicines whose stock has the given status (same rule as StockStatus::fromUnits).
     *
     * @param  Builder<Medicine>  $query
     */
    #[Scope]
    protected function whereStockStatus(Builder $query, StockStatus $status): void
    {
        $today = self::today();

        match ($status) {
            StockStatus::Out => $query->whereRaw(self::SELLABLE_UNITS_SQL.' <= 0', [$today]),
            StockStatus::Low => $query->whereRaw(
                self::SELLABLE_UNITS_SQL.' > 0 AND '.self::SELLABLE_UNITS_SQL.' <= medicines.min_stock_units',
                [$today, $today],
            ),
            StockStatus::Ok => $query->whereRaw(self::SELLABLE_UNITS_SQL.' > medicines.min_stock_units', [$today]),
        };
    }

    private static function today(): string
    {
        return Carbon::today()->toDateString();
    }
}
