<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

/**
 * Placeholder suppliers from the reception design, until the pharmacy's real supplier list is entered.
 * Safe to run more than once: suppliers are matched by name.
 */
class SupplierSeeder extends Seeder
{
    public const SUPPLIERS = ['[GROSSISTE A]', '[GROSSISTE B]'];

    public function run(): void
    {
        foreach (self::SUPPLIERS as $name) {
            Supplier::query()->firstOrCreate(['name' => $name], ['is_active' => true]);
        }
    }
}
