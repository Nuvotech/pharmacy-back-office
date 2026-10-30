<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Enums\StockStatus;
use App\Models\Category;
use App\Models\Medicine;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A row of the "Médicaments" list. Stock figures and status are computed here, never in the page.
 * Prices are decimal strings in the base currency (CDF).
 *
 * @mixin Medicine
 */
class MedicineListResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $sellableUnits = (int) $this->sellable_units;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'dci' => $this->dci,
            'form' => $this->form,
            'image_url' => $this->image_path ? asset('storage/'.$this->image_path) : null,
            'categories' => $this->categories->map(fn (Category $category): string => $category->name)->values(),
            'units_per_pack' => $this->units_per_pack,
            'sale_price_pack' => $this->sale_price_pack,
            'sale_price_unit' => $this->sale_price_unit,
            'min_stock_units' => $this->min_stock_units,
            'sellable_units' => $sellableUnits,
            'sellable_packs' => intdiv($sellableUnits, max(1, $this->units_per_pack)),
            'stock_status' => StockStatus::fromUnits($sellableUnits, $this->min_stock_units)->value,
            'prescription_required' => $this->prescription_required,
        ];
    }
}
