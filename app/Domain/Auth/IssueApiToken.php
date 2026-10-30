<?php

declare(strict_types=1);

namespace App\Domain\Auth;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Signs a user in on a tablet with their username and PIN and issues a Sanctum token.
 */
class IssueApiToken
{
    /**
     * Hours an API token stays valid: one working day.
     */
    public const TOKEN_LIFETIME_HOURS = 12;

    /**
     * @throws InvalidCredentials when the username is unknown, the account is inactive or the PIN is wrong
     */
    public function handle(string $username, string $pin, string $deviceName): IssuedToken
    {
        $user = User::query()
            ->where('username', mb_strtolower(trim($username)))
            ->where('is_active', true)
            ->first();

        // The same answer for every failure, so the response does not reveal which usernames exist.
        if ($user === null || $user->pin_hash === null || ! Hash::check($pin, $user->pin_hash)) {
            throw new InvalidCredentials;
        }

        $expiresAt = now()->addHours(self::TOKEN_LIFETIME_HOURS);

        $plainTextToken = DB::transaction(function () use ($user, $pin, $deviceName, $expiresAt): string {
            // PINs hashed with an older cost are re-hashed now: the only time the server sees the PIN.
            if ($user->pinNeedsRehash()) {
                $user->pin_hash = $pin;
                $user->save();
            }

            // One token per user and device: signing in again replaces the previous one.
            $user->tokens()->where('name', $deviceName)->delete();

            return $user->createToken($deviceName, $user->role->tokenAbilities(), $expiresAt)->plainTextToken;
        });

        return new IssuedToken($user, $plainTextToken, $expiresAt);
    }
}
