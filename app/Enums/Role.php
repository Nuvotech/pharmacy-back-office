<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Mirrors the `users.role` enum column.
 */
enum Role: string
{
    case Admin = 'admin';
    case Pharmacist = 'pharmacist';
    case Cashier = 'cashier';

    /**
     * Sanctum abilities given to an API token issued to a user with this role.
     *
     * @return list<string>
     */
    public function tokenAbilities(): array
    {
        return match ($this) {
            self::Admin, self::Pharmacist => ['counter', 'back-office'],
            self::Cashier => ['counter'],
        };
    }
}
