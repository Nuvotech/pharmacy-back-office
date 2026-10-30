<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\ExchangeRateFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * The day's rate, entered by the pharmacist: 1 USD = usd_to_cdf CDF.
 *
 * @property int $id
 * @property Carbon $rate_date
 * @property string $usd_to_cdf
 * @property int|null $user_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['rate_date', 'usd_to_cdf', 'user_id'])]
class ExchangeRate extends Model
{
    /** @use HasFactory<ExchangeRateFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'rate_date' => 'date',
            'usd_to_cdf' => 'decimal:4',
        ];
    }

    /**
     * The rate in force on a date: that day's, or the latest one before it.
     *
     * @param  Builder<ExchangeRate>  $query
     */
    #[Scope]
    protected function inForceOn(Builder $query, string $date): void
    {
        $query->whereDate('rate_date', '<=', $date)->orderByDesc('rate_date')->limit(1);
    }
}
