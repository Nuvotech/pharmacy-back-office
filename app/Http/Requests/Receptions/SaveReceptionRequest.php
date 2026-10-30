<?php

declare(strict_types=1);

namespace App\Http\Requests\Receptions;

use App\Domain\Receptions\SaveReceptionDraft;
use App\Enums\InvoiceCurrency;
use App\Models\Medicine;
use App\Models\Supplier;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * A reception from the web back office. A draft may be incomplete; validating needs the
 * supplier, the invoice number and at least one line.
 *
 * @phpstan-import-type ReceptionInput from SaveReceptionDraft
 */
class SaveReceptionRequest extends FormRequest
{
    /**
     * Access is checked by the `can` middleware on the route.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prices may be typed with a decimal comma ("2,60").
     */
    protected function prepareForValidation(): void
    {
        $lines = $this->input('lines');

        if (is_array($lines)) {
            $this->merge([
                'lines' => array_map(
                    fn (mixed $line): mixed => is_array($line) && is_string($line['cost_per_pack'] ?? null)
                        ? [...$line, 'cost_per_pack' => str_replace([',', ' '], ['.', ''], $line['cost_per_pack'])]
                        : $line,
                    $lines,
                ),
            ]);
        }
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $isValidating = $this->isValidating();

        return [
            'id' => ['nullable', 'uuid'],
            'supplier_id' => [
                Rule::requiredIf($isValidating),
                'nullable',
                'uuid',
                Rule::exists(Supplier::class, 'id')->where('is_active', true),
            ],
            'invoice_ref' => [Rule::requiredIf($isValidating), 'nullable', 'string', 'max:100'],
            'received_on' => ['required', 'date_format:Y-m-d'],
            'currency' => ['required', Rule::enum(InvoiceCurrency::class)],
            'lines' => [$isValidating ? 'required' : 'present', 'array', 'max:200'],
            'lines.*.medicine_id' => [
                'required',
                'uuid',
                Rule::exists(Medicine::class, 'id')->where('is_active', true),
            ],
            'lines.*.lot_number' => ['required', 'string', 'max:100'],
            'lines.*.expiry' => ['required', 'date_format:Y-m'],
            'lines.*.packs' => ['required', 'integer', 'min:1', 'max:100000'],
            'lines.*.units_per_pack' => ['required', 'integer', 'min:1', 'max:10000'],
            'lines.*.cost_per_pack' => ['required', 'regex:/^\d{1,10}(\.\d{1,2})?$/'],
            'short_dated_confirmed' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        $message = fn (string $key): string => __("receptions.{$key}", locale: 'fr');

        return [
            'supplier_id.required' => $message('supplier_required'),
            'supplier_id.exists' => $message('supplier_required'),
            'invoice_ref.required' => $message('invoice_ref_required'),
            'received_on.required' => $message('received_on_required'),
            'received_on.date_format' => $message('received_on_required'),
            'currency.required' => $message('currency_required'),
            'currency.enum' => $message('currency_required'),
            'lines.required' => $message('lines_required'),
            'lines.*.medicine_id.required' => $message('medicine_required'),
            'lines.*.medicine_id.exists' => $message('medicine_required'),
            'lines.*.lot_number.required' => $message('lot_required'),
            'lines.*.expiry.required' => $message('expiry_format'),
            'lines.*.expiry.date_format' => $message('expiry_format'),
            'lines.*.packs.required' => $message('packs_min'),
            'lines.*.packs.integer' => $message('packs_min'),
            'lines.*.packs.min' => $message('packs_min'),
            'lines.*.units_per_pack.required' => $message('units_per_pack_min'),
            'lines.*.units_per_pack.integer' => $message('units_per_pack_min'),
            'lines.*.units_per_pack.min' => $message('units_per_pack_min'),
            'lines.*.units_per_pack.max' => $message('units_per_pack_min'),
            'lines.*.cost_per_pack.required' => $message('cost_format'),
            'lines.*.cost_per_pack.regex' => $message('cost_format'),
        ];
    }

    /**
     * The validated reception, typed for the Domain services.
     *
     * @return ReceptionInput
     */
    public function reception(): array
    {
        /** @var array{id?: string|null, supplier_id?: string|null, invoice_ref?: string|null, received_on: string, currency: string, lines: list<array{medicine_id: string, lot_number: string, expiry: string, packs: int|string, units_per_pack: int|string, cost_per_pack: numeric-string}>} $data */
        $data = $this->validated();

        return [
            'id' => $data['id'] ?? null,
            'supplier_id' => $data['supplier_id'] ?? null,
            'invoice_ref' => $data['invoice_ref'] ?? null,
            'received_on' => $data['received_on'],
            'currency' => $data['currency'],
            'lines' => array_map(fn (array $line): array => [
                'medicine_id' => $line['medicine_id'],
                'lot_number' => $line['lot_number'],
                'expiry' => $line['expiry'],
                'packs' => (int) $line['packs'],
                'units_per_pack' => (int) $line['units_per_pack'],
                'cost_per_pack' => $line['cost_per_pack'],
            ], $data['lines']),
        ];
    }

    public function isShortDatedConfirmed(): bool
    {
        return $this->boolean('short_dated_confirmed');
    }

    private function isValidating(): bool
    {
        return $this->routeIs('receptions.validate');
    }
}
