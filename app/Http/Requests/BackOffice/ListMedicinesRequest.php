<?php

declare(strict_types=1);

namespace App\Http\Requests\BackOffice;

use App\Models\Category;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Query string of the "Médicaments" list. An unknown filter or category is reset rather than refused,
 * so an old bookmarked link still opens the list.
 */
class ListMedicinesRequest extends FormRequest
{
    public const FILTERS = ['all', 'out', 'low', 'prescription'];

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $filter = $this->query('filter');
        $category = $this->query('category');
        $search = $this->query('search');

        $this->merge([
            'filter' => in_array($filter, self::FILTERS, true) ? $filter : 'all',
            'category' => is_string($category) && Category::query()->where('slug', $category)->exists() ? $category : null,
            'search' => is_string($search) ? mb_substr(trim($search), 0, 100) : null,
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string'],
            'filter' => ['required', 'string'],
        ];
    }
}
