<?php

declare(strict_types=1);

namespace App\Http\Requests\BackOffice;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UploadStockFileRequest extends FormRequest
{
    /**
     * Access is checked by the `can` middleware on the route.
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
            'file' => ['required', 'file', 'mimes:xlsx,csv,txt', 'max:5120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.required' => __('stock_import.file_required', locale: 'fr'),
            'file.file' => __('stock_import.file_required', locale: 'fr'),
            'file.mimes' => __('stock_import.file_type', locale: 'fr'),
            'file.max' => __('stock_import.file_size', locale: 'fr'),
        ];
    }
}
