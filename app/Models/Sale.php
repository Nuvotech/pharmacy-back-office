<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A sale made on a tablet, pushed up by sync with the tablet's UUID. Amounts in the base currency (CDF)
 * unless noted; `amount_paid` is in `currency_paid`; change is always given in CDF.
 *
 * @property string $id
 * @property string $receipt_no
 * @property string|null $device_id
 * @property int|null $user_id
 * @property numeric-string $total
 * @property string $currency_paid
 * @property numeric-string $exchange_rate
 * @property numeric-string $amount_paid
 * @property numeric-string $change_given
 * @property string $payment_method
 * @property string|null $payment_ref
 * @property string|null $prescriber
 * @property string|null $patient_name
 * @property string $status
 * @property Carbon $sold_at
 * @property Carbon|null $synced_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Sale extends Model
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
            'total' => 'decimal:2',
            'exchange_rate' => 'decimal:4',
            'amount_paid' => 'decimal:2',
            'change_given' => 'decimal:2',
            'sold_at' => 'datetime',
            'synced_at' => 'datetime',
        ];
    }

    /**
     * @return HasMany<SaleItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    /**
     * @return BelongsTo<Device, $this>
     */
    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }
}
