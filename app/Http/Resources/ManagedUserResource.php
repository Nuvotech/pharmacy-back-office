<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * An account as the "Utilisateurs" screen shows it. Never includes the PIN or password, only whether one is set.
 *
 * @mixin User
 */
class ManagedUserResource extends JsonResource
{
    /**
     * @return array{id: int, name: string, username: string|null, email: string|null, role: string, is_active: bool, has_pin: bool}
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'email' => $this->email,
            'role' => $this->role->value,
            'is_active' => $this->is_active,
            'has_pin' => $this->pin_hash !== null,
        ];
    }
}
