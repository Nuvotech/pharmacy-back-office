<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\MovementType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Append-only history of every stock change (+ in, - out, in units). Never updated or deleted.
 *
 * @property string $id
 * @property string $batch_id
 * @property string $medicine_id
 * @property MovementType $type
 * @property int $qty_units
 * @property string|null $reason
 * @property string|null $reference_type
 * @property string|null $reference_id
 * @property int|null $user_id
 * @property string|null $device_id
 * @property Carbon $occurred_at
 * @property Carbon|null $created_at
 */
class StockMovement extends Model
{
    use HasUuids;

    public const UPDATED_AT = null;

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
            'type' => MovementType::class,
            'qty_units' => 'integer',
            'occurred_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Batch, $this>
     */
    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class);
    }
}
