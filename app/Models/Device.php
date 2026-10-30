<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A tablet or phone that syncs with the server. Until device registration exists, a device is the token
 * name the app signs in with (e.g. "Caisse 1").
 *
 * @property string $id
 * @property string $name
 * @property bool $is_active
 * @property Carbon|null $last_sync_at
 * @property int|null $last_clock_skew_s device time minus server time
 * @property int|null $last_user_id who was signed in at the last sync
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User|null $lastUser
 */
class Device extends Model
{
    use HasUuids;

    /**
     * @var list<string>
     */
    protected $fillable = ['name', 'is_active', 'last_sync_at', 'last_clock_skew_s', 'last_user_id'];

    /**
     * @return BelongsTo<User, $this>
     */
    public function lastUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'last_user_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'last_sync_at' => 'datetime',
            'last_clock_skew_s' => 'integer',
        ];
    }
}
