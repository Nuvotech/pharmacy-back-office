<?php

namespace App\Models;

use App\Enums\Role;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property int $id
 * @property string $name
 * @property string|null $username
 * @property string|null $email
 * @property string|null $password
 * @property string|null $pin_hash
 * @property Role $role
 * @property bool $is_active
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'username', 'email', 'password'])]
#[Hidden(['password', 'pin_hash', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * bcrypt cost for PINs. Tablets check the PIN offline in JavaScript, where cost 12 takes 10 s or more;
     * cost 8 stays under a second. A 4–8 digit PIN is protected by the lock and token revocation, not by cost.
     */
    public const PIN_HASH_ROUNDS = 8;

    /**
     * Assigning a plain PIN stores its hash; an existing hash is kept as is.
     *
     * @return Attribute<string|null, string|null>
     */
    protected function pinHash(): Attribute
    {
        return Attribute::make(
            set: fn (?string $value): ?string => $value === null || Hash::isHashed($value)
                ? $value
                : Hash::make($value, ['rounds' => self::PIN_HASH_ROUNDS]),
        );
    }

    /**
     * True when the stored PIN hash was made with another cost and should be replaced at the next sign-in.
     */
    public function pinNeedsRehash(): bool
    {
        return $this->pin_hash !== null && Hash::needsRehash($this->pin_hash, ['rounds' => self::PIN_HASH_ROUNDS]);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'role' => Role::class,
            'is_active' => 'boolean',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }
}
