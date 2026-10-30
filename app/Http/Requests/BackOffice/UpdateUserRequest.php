<?php

declare(strict_types=1);

namespace App\Http\Requests\BackOffice;

use App\Enums\Role;
use Illuminate\Validation\Validator;

/**
 * Same rules as creating, except blank PIN and password keep the current ones, and an admin cannot lock
 * themselves out.
 */
class UpdateUserRequest extends StoreUserRequest
{
    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($this->editedUser()?->id !== $this->user()?->id) {
                    return;
                }

                if (! $this->boolean('is_active')) {
                    $validator->errors()->add('is_active', __('users.cannot_deactivate_self', locale: 'fr'));
                }

                if ($this->input('role') !== Role::Admin->value) {
                    $validator->errors()->add('role', __('users.cannot_change_own_role', locale: 'fr'));
                }
            },
        ];
    }
}
