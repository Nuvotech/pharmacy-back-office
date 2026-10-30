<?php

namespace Database\Factories;

use App\Models\Medicine;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * @extends Factory<Medicine>
 */
class MedicineFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => Str::upper(fake()->unique()->lexify('?????????')).' '.fake()->randomElement(['250 MG', '500 MG', 'SIROP 1FL']),
            'dci' => null,
            'units_per_pack' => 10,
            'sale_price_pack' => '1000.00',
            'sale_price_unit' => '100.00',
            'min_stock_units' => 50,
            'prescription_required' => false,
            'is_active' => true,
        ];
    }

    /**
     * Indicate that the medicine needs a prescription.
     */
    public function prescriptionRequired(): static
    {
        return $this->state(fn (array $attributes) => [
            'prescription_required' => true,
        ]);
    }

    /**
     * Give the medicine a lot with this many units, expiring on the given date (next year by default).
     * Test data only: real stock goes through the stock ledger.
     */
    public function withLot(int $units, ?CarbonInterface $expiresOn = null): static
    {
        return $this->afterCreating(function (Medicine $medicine) use ($units, $expiresOn): void {
            DB::table('batches')->insert([
                'id' => (string) Str::orderedUuid(),
                'medicine_id' => $medicine->id,
                'lot_number' => 'LOT-'.Str::upper(Str::random(6)),
                'expiry_date' => ($expiresOn ?? now()->addYear())->toDateString(),
                'qty_received' => $units,
                'qty_on_hand' => $units,
                'received_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });
    }
}
