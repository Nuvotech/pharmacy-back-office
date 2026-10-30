<?php

declare(strict_types=1);

namespace App\Http\Requests\BackOffice;

use App\Models\Category;
use App\Models\Medicine;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * "Nouveau médicament" and "Modifier". Prices are whole francs (FC has no subunit); quantities are units.
 */
class SaveMedicineRequest extends FormRequest
{
    /**
     * Access is checked by the `can` middleware on the route.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Amounts may be typed with spaces ("2 500"); blank optional fields are stored as null.
     */
    protected function prepareForValidation(): void
    {
        $digits = fn (string $key): mixed => is_string($this->input($key))
            ? str_replace([' ', "\u{202F}", "\u{00A0}"], '', $this->input($key))
            : $this->input($key);

        $this->merge([
            'sale_price_pack' => $digits('sale_price_pack'),
            'sale_price_unit' => $this->boolean('sells_by_unit') ? $digits('sale_price_unit') : null,
            'units_per_pack' => $digits('units_per_pack'),
            'min_stock_units' => $digits('min_stock_units'),
            'barcode' => $this->filled('barcode') ? $digits('barcode') : null,
            'prescription_required' => $this->boolean('prescription_required'),
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $medicine = $this->route('medicine');

        return [
            'name' => ['required', 'string', 'max:255'],
            'dci' => ['nullable', 'string', 'max:255'],
            'dosage' => ['nullable', 'string', 'max:100'],
            'form' => ['nullable', 'string', 'max:100'],
            'barcode' => [
                'nullable',
                'regex:/^\d{4,64}$/',
                Rule::unique(Medicine::class)->ignore($medicine instanceof Medicine ? $medicine->id : null),
            ],
            'units_per_pack' => ['required', 'integer', 'min:1', 'max:10000'],
            'sale_price_pack' => ['required', 'integer', 'min:0', 'max:1000000000'],
            'sale_price_unit' => ['nullable', 'integer', 'min:0', 'max:1000000000'],
            'min_stock_units' => ['required', 'integer', 'min:0', 'max:10000000'],
            'prescription_required' => ['required', 'boolean'],
            'category_slugs' => ['present', 'array', 'max:20'],
            'category_slugs.*' => ['string', Rule::exists(Category::class, 'slug')],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        $message = fn (string $key): string => __("medicines.{$key}", locale: 'fr');

        return [
            'name.required' => $message('name_required'),
            'units_per_pack.required' => $message('units_per_pack_min'),
            'units_per_pack.integer' => $message('units_per_pack_min'),
            'units_per_pack.min' => $message('units_per_pack_min'),
            'sale_price_pack.required' => $message('sale_price_pack_format'),
            'sale_price_pack.integer' => $message('sale_price_pack_format'),
            'sale_price_pack.min' => $message('sale_price_pack_format'),
            'sale_price_unit.integer' => $message('sale_price_unit_format'),
            'sale_price_unit.min' => $message('sale_price_unit_format'),
            'min_stock_units.required' => $message('min_stock_units_format'),
            'min_stock_units.integer' => $message('min_stock_units_format'),
            'min_stock_units.min' => $message('min_stock_units_format'),
            'barcode.unique' => $message('barcode_taken'),
            'barcode.regex' => $message('barcode_format'),
            'category_slugs.*.exists' => $message('category_unknown'),
        ];
    }

    /**
     * The validated medicine, typed for SaveMedicine.
     *
     * @return array{name: string, dci: string|null, dosage: string|null, form: string|null, barcode: string|null, units_per_pack: int, sale_price_pack: int, sale_price_unit: int|null, min_stock_units: int, prescription_required: bool, category_slugs: list<string>}
     */
    public function medicine(): array
    {
        /** @var array{name: string, dci?: string|null, dosage?: string|null, form?: string|null, barcode?: string|null, units_per_pack: int|string, sale_price_pack: int|string, sale_price_unit?: int|string|null, min_stock_units: int|string, prescription_required: bool, category_slugs: list<string>} $data */
        $data = $this->validated();
        $blankToNull = fn (?string $value): ?string => $value === null || trim($value) === '' ? null : trim($value);

        return [
            'name' => trim($data['name']),
            'dci' => $blankToNull($data['dci'] ?? null),
            'dosage' => $blankToNull($data['dosage'] ?? null),
            'form' => $blankToNull($data['form'] ?? null),
            'barcode' => $blankToNull($data['barcode'] ?? null),
            'units_per_pack' => (int) $data['units_per_pack'],
            'sale_price_pack' => (int) $data['sale_price_pack'],
            'sale_price_unit' => isset($data['sale_price_unit']) ? (int) $data['sale_price_unit'] : null,
            'min_stock_units' => (int) $data['min_stock_units'],
            'prescription_required' => $data['prescription_required'],
            'category_slugs' => array_values(array_unique($data['category_slugs'])),
        ];
    }
}
