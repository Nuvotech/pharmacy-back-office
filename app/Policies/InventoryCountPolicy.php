<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\InventoryCount;
use App\Models\User;

/**
 * Admins and pharmacists run stock counts; cashiers only sell.
 */
class InventoryCountPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, [Role::Admin, Role::Pharmacist], true);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, [Role::Admin, Role::Pharmacist], true);
    }

    public function update(User $user, InventoryCount $count): bool
    {
        return in_array($user->role, [Role::Admin, Role::Pharmacist], true);
    }
}
