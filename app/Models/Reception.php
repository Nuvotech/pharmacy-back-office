<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\InvoiceCurrency;
use App\Enums\ReceptionStatus;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A delivery from a supplier. Saved as a draft until validated; validation turns each line into a lot.
 * `total_cost` is the invoice total in the invoice currency.
 *
 * @property string $id
 * @property ReceptionStatus $status
 * @property string|null $supplier_id
 * @property string|null $invoice_ref
 * @property InvoiceCurrency $currency
 * @property string|null $exchange_rate
 * @property Carbon $received_at
 * @property Carbon|null $validated_at
 * @property string $total_cost
 * @property bool $is_opening_stock
 * @property int|null $user_id
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Supplier|null $supplier
 * @property-read Collection<int, ReceptionLine> $lines
 */
class Reception extends Model
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
            'status' => ReceptionStatus::class,
            'currency' => InvoiceCurrency::class,
            'exchange_rate' => 'decimal:4',
            'received_at' => 'datetime',
            'validated_at' => 'datetime',
            'total_cost' => 'decimal:2',
            'is_opening_stock' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Supplier, $this>
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<ReceptionLine, $this>
     */
    public function lines(): HasMany
    {
        return $this->hasMany(ReceptionLine::class)->orderBy('position');
    }

    /**
     * @return HasMany<Batch, $this>
     */
    public function batches(): HasMany
    {
        return $this->hasMany(Batch::class);
    }
}
