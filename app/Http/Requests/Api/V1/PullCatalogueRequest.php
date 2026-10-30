<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use App\Domain\Sync\PullCatalogue;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class PullCatalogueRequest extends FormRequest
{
    /**
     * Access is checked by the `abilities:counter` middleware on the route.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * A page larger than the maximum gets the maximum, not an error.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('limit')) {
            $this->merge(['limit' => min(PullCatalogue::DEFAULT_LIMIT, max(1, (int) $this->query('limit')))]);
        }
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'cursor' => ['nullable', 'string', 'max:500'],
            'limit' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
