<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Units sold on a tablet that no lot on the server could cover; for the pharmacist to resolve.
 *
 * @property string $id
 * @property string|null $sale_item_id
 * @property string $medicine_id
 * @property string|null $batch_id
 * @property int $qty_short_units
 * @property string $status open | resolved
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class StockDiscrepancy extends Model
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
            'qty_short_units' => 'integer',
        ];
    }
}
