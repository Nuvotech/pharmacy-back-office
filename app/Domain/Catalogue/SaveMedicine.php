<?php

declare(strict_types=1);

namespace App\Domain\Catalogue;

use App\Models\Category;
use App\Models\Medicine;
use Illuminate\Support\Facades\DB;

/**
 * Creates or updates a medicine from the back-office form. The medicine is always touched, so tablets get
 * the change (category changes included) on their next catalogue pull.
 */
class SaveMedicine
{
    /**
     * @param  array{name: string, dci: string|null, dosage: string|null, form: string|null, barcode: string|null, units_per_pack: int, sale_price_pack: int, sale_price_unit: int|null, min_stock_units: int, prescription_required: bool, category_slugs: list<string>}  $data  prices in whole FC
     */
    public function handle(?Medicine $medicine, array $data): Medicine
    {
        $medicine ??= new Medicine(['is_active' => true]);

        return DB::transaction(function () use ($medicine, $data): Medicine {
            $medicine->fill([
                'name' => $data['name'],
                'dci' => $data['dci'],
                'dosage' => $data['dosage'],
                'form' => $data['form'],
                'barcode' => $data['barcode'],
                'units_per_pack' => $data['units_per_pack'],
                'sale_price_pack' => $data['sale_price_pack'],
                'sale_price_unit' => $data['sale_price_unit'],
                'min_stock_units' => $data['min_stock_units'],
                'prescription_required' => $data['prescription_required'],
            ]);
            $medicine->save();

            $medicine->categories()->sync(
                Category::query()->whereIn('slug', $data['category_slugs'])->pluck('id')->all(),
            );
            $medicine->touch();

            return $medicine;
        });
    }
}
