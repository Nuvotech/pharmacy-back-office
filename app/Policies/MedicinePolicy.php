<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\Medicine;
use App\Models\User;

/**
 * Admins and pharmacists manage the catalogue; cashiers only sell.
 */
class MedicinePolicy
{
    public function create(User $user): bool
    {
        return in_array($user->role, [Role::Admin, Role::Pharmacist], true);
    }

    public function update(User $user, Medicine $medicine): bool
    {
        return in_array($user->role, [Role::Admin, Role::Pharmacist], true);
    }
}
