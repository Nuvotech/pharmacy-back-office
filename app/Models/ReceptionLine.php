<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One line of a delivery as typed from the invoice: packs delivered and the cost of one pack in the
 * invoice currency.
 *
 * @property string $id
 * @property string $reception_id
 * @property string $medicine_id
 * @property string $lot_number
 * @property Carbon $expiry_date
 * @property int $packs
 * @property int|null $units_per_pack null on lines saved before it was asked: use the medicine's
 * @property numeric-string $cost_per_pack
 * @property int $position
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Medicine $medicine
 */
class ReceptionLine extends Model
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
            'expiry_date' => 'date',
            'packs' => 'integer',
            'units_per_pack' => 'integer',
            'cost_per_pack' => 'decimal:4',
            'position' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Reception, $this>
     */
    public function reception(): BelongsTo
    {
        return $this->belongsTo(Reception::class);
    }

    /**
     * @return BelongsTo<Medicine, $this>
     */
    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }
}
