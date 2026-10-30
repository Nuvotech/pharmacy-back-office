<?php

declare(strict_types=1);

namespace App\Http\Requests\BackOffice;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    /**
     * Access is checked by the `can` middleware on the route.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Usernames are typed in lower case on the tablet; cashiers have no back-office login.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'username' => $this->filled('username') ? mb_strtolower(trim($this->string('username')->toString())) : null,
            'is_active' => $this->boolean('is_active'),
        ]);

        if ($this->input('role') === Role::Cashier->value) {
            $this->merge(['email' => null, 'password' => null]);
        }
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->editedUser();
        $hasBackOfficeLogin = $this->input('role') !== Role::Cashier->value;

        return [
            'name' => ['required', 'string', 'max:255'],
            'role' => ['required', Rule::enum(Role::class)],
            'username' => [
                Rule::requiredIf(! $hasBackOfficeLogin),
                'nullable',
                'string',
                'regex:/^[a-z0-9._-]{3,50}$/',
                Rule::unique(User::class)->ignore($user?->id),
            ],
            'pin' => [
                Rule::requiredIf($this->filled('username') && $user?->pin_hash === null),
                'nullable',
                'string',
                'regex:/^\d{4,8}$/',
            ],
            'email' => [
                Rule::requiredIf($hasBackOfficeLogin),
                'nullable',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($user?->id),
            ],
            'password' => [
                Rule::requiredIf($hasBackOfficeLogin && $user?->password === null),
                'nullable',
                'string',
                'min:8',
            ],
            'is_active' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        $message = fn (string $key): string => __("users.{$key}", locale: 'fr');

        return [
            'name.required' => $message('name_required'),
            'role.required' => $message('role_required'),
            'role.enum' => $message('role_required'),
            'username.required' => $message('username_required'),
            'username.regex' => $message('username_format'),
            'username.unique' => $message('username_taken'),
            'pin.required' => $message('pin_required'),
            'pin.regex' => $message('pin_format'),
            'email.required' => $message('email_required'),
            'email.email' => $message('email_format'),
            'email.unique' => $message('email_taken'),
            'password.required' => $message('password_required'),
            'password.min' => __('users.password_min', ['min' => 8], 'fr'),
        ];
    }

    /**
     * The account being edited, or null when creating one.
     */
    protected function editedUser(): ?User
    {
        $user = $this->route('user');

        return $user instanceof User ? $user : null;
    }
}
