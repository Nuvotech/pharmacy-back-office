<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

/**
 * The medicine categories used at the counter, in the order the counter shows them.
 * Safe to run more than once: categories are matched by slug and never duplicated.
 */
class CategorySeeder extends Seeder
{
    /**
     * slug => name shown in the UI
     */
    public const CATEGORIES = [
        'paludisme' => 'Paludisme',
        'antibiotiques' => 'Antibiotiques',
        'douleur' => 'Douleur',
        'enfants' => 'Enfants',
        'vitamines' => 'Vitamines',
    ];

    public function run(): void
    {
        $sortOrder = 0;

        foreach (self::CATEGORIES as $slug => $name) {
            Category::query()->updateOrCreate(['slug' => $slug], ['name' => $name, 'sort_order' => $sortOrder++]);
        }
    }
}
