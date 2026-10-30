<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\User;

/**
 * Admins and pharmacists receive deliveries; cashiers only sell.
 */
class ReceptionPolicy
{
    public function create(User $user): bool
    {
        return in_array($user->role, [Role::Admin, Role::Pharmacist], true);
    }
}
