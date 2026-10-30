<?php

declare(strict_types=1);

namespace App\Http\Requests\BackOffice;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Units counted in one lot; blank clears the count. Spaces are allowed ("1 200").
 */
class RecordCountRequest extends FormRequest
{
    /**
     * Access is checked by the `can` middleware on the route.
     */
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $value = $this->input('counted_units');

        $this->merge([
            'counted_units' => is_string($value)
                ? (trim($value) === '' ? null : str_replace([' ', "\u{202F}", "\u{00A0}"], '', $value))
                : $value,
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'counted_units' => ['nullable', 'integer', 'min:0', 'max:10000000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        $message = __('inventory.counted_format', locale: 'fr');

        return [
            'counted_units.integer' => $message,
            'counted_units.min' => $message,
            'counted_units.max' => $message,
        ];
    }

    public function countedUnits(): ?int
    {
        $value = $this->validated('counted_units');

        return $value === null ? null : (int) $value;
    }
}
