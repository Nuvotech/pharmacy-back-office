<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\StockImport;
use App\Models\User;

/**
 * Admins and pharmacists load the opening stock; cashiers only sell.
 */
class StockImportPolicy
{
    public function create(User $user): bool
    {
        return in_array($user->role, [Role::Admin, Role::Pharmacist], true);
    }

    public function view(User $user, StockImport $stockImport): bool
    {
        return in_array($user->role, [Role::Admin, Role::Pharmacist], true);
    }
}
