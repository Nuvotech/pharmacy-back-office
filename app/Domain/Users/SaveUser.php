<?php

declare(strict_types=1);

namespace App\Domain\Users;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Creates or updates an account from the "Utilisateurs" screen.
 */
class SaveUser
{
    /**
     * Blank PIN and password fields keep the current ones. Cashiers never get a back-office login.
     * Changing the PIN, password or role, or deactivating the account, signs it out of every tablet.
     *
     * @param  array{name: string, role: string, username?: string|null, email?: string|null, pin?: string|null, password?: string|null, is_active: bool}  $data
     */
    public function handle(?User $user, array $data): User
    {
        $user ??= new User;
        $role = Role::from($data['role']);
        $username = isset($data['username']) && $data['username'] !== '' ? mb_strtolower(trim($data['username'])) : null;

        $user->name = $data['name'];
        $user->role = $role;
        $user->username = $username;
        $user->is_active = $data['is_active'];

        if ($role === Role::Cashier) {
            $user->email = null;
            $user->password = null;
        } else {
            $user->email = $data['email'] ?? null;
            if (! empty($data['password'])) {
                $user->password = $data['password'];
            }
        }

        if ($username === null) {
            $user->pin_hash = null;
        } elseif (! empty($data['pin'])) {
            $user->pin_hash = $data['pin'];
        }

        $mustSignOut = $user->exists
            && ($user->isDirty(['pin_hash', 'password', 'role', 'username']) || ! $user->is_active);

        return DB::transaction(function () use ($user, $mustSignOut): User {
            $user->save();

            if ($mustSignOut) {
                $user->tokens()->delete();
            }

            return $user;
        });
    }
}
