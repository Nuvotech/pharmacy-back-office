<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Category;
use App\Models\Medicine;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A medicine as the tablet stores it. Prices are decimal strings in the base currency (CDF); the photo is
 * a path on the public disk (the tablet builds the URL from its own server address).
 *
 * @mixin Medicine
 */
class SyncMedicineResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'dci' => $this->dci,
            'dosage' => $this->dosage,
            'form' => $this->form,
            'barcode' => $this->barcode,
            'image_path' => $this->image_path,
            'units_per_pack' => $this->units_per_pack,
            'sale_price_pack' => $this->sale_price_pack,
            'sale_price_unit' => $this->sale_price_unit,
            'min_stock_units' => $this->min_stock_units,
            'prescription_required' => $this->prescription_required,
            'is_active' => $this->is_active,
            'category_slugs' => $this->categories->map(fn (Category $category): string => $category->slug)->values(),
            'updated_at' => $this->updated_at?->utc()->toIso8601ZuluString(),
        ];
    }
}
