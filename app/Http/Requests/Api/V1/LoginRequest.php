<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    /**
     * Anyone may try to sign in; the credentials are checked by the Domain service.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'username' => ['required', 'string', 'max:50'],
            'pin' => ['required', 'string', 'regex:/^\d{4,8}$/'],
            'device_name' => ['required', 'string', 'max:100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'username.required' => __('api.username_required', locale: 'fr'),
            'pin.required' => __('api.pin_required', locale: 'fr'),
            'pin.regex' => __('api.pin_format', locale: 'fr'),
            'device_name.required' => __('api.device_name_required', locale: 'fr'),
        ];
    }
}
