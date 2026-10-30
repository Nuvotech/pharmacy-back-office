<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Catalogue\StoreMedicinePhoto;
use App\Models\Category;
use App\Models\Medicine;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Seeds the PHARMAPLUS medicine list (data/medicines_pharmaplus.csv, 1,745 names).
 *
 * The source list holds names only: no quantity, price, DCI, dosage, form or pack size.
 * Each medicine is created with neutral defaults (1 unit per pack, price 0, minimum stock 0)
 * for the pharmacist to complete in the back office. Stock is NOT created here: it comes from
 * the opening-stock import, with lot numbers and expiry dates.
 *
 * Safe to run more than once: a name that already exists (ignoring case and extra spaces)
 * is skipped, so medicines edited in the back office are never overwritten.
 *
 * The counter's 15 product pictures (data/medicine-images) are then matched to the medicines of the
 * list they show, by exact name, together with the counter's categories for that product. A medicine
 * that already has a photo keeps it; categories are only added, never removed.
 */
class MedicineSeeder extends Seeder
{
    private const FILE = __DIR__.'/data/medicines_pharmaplus.csv';

    private const IMAGES_DIRECTORY = __DIR__.'/data/medicine-images';

    private const CHUNK = 500;

    /**
     * Picture (file name without .png) => the counter's categories for it and the exact names in the list
     * that it shows. Names are compared ignoring case and extra spaces.
     *
     * @var array<string, array{categories: list<string>, names: list<string>}>
     */
    public const PRODUCT_IMAGES = [
        'paracetamol' => [
            'categories' => ['douleur'],
            'names' => ['PARACETAMOL', 'PARACETAMOL 500 MG CES 1CE', 'Paracetamol TEVA 1G 1 ce'],
        ],
        'paracetamol-sirop' => [
            'categories' => ['douleur', 'enfants'],
            'names' => ['PARACETAMOL SIROP 1FL', 'PARACETAMOL SP 125mg 1FL', 'PARACETAMOL SUSPENSION'],
        ],
        'artemether' => [
            'categories' => ['paludisme'],
            'names' => [
                'ARTEMETER LUMIFANTRINE 180MG 1080MG',
                'COARTEM',
                'CO-ARTEM 20 MG/120 B/12 ENFT 1BTE CURE DE 12',
                'CO-ARTEM 20 MG/120 BEBE 1BTE CURE DE 6',
                'COARTEM CES 80/480MG AD B/6 (EUR) 1 CE CURE DE 6',
            ],
        ],
        'artesunate' => [
            'categories' => ['paludisme'],
            'names' => ['ARTESUNATE 60MG', 'ARTESUNATE 120MG'],
        ],
        'quinine' => [
            'categories' => ['paludisme'],
            'names' => ['QUININE 300 MG CES 1CE', 'QUININE 300MG', 'QUININE 500MG'],
        ],
        'amoxicilline' => [
            'categories' => ['antibiotiques'],
            'names' => [
                'AMOXYCILLINE 500 MG CAPS 1CAP',
                'AMOXYCILLIN 500MG',
                'AMOXYCILLINE 500MG',
                'AMOXYCILLIN 250MG',
                'AMOXYCILLINE 250MG',
            ],
        ],
        'metronidazole' => [
            'categories' => ['antibiotiques'],
            'names' => [
                'METRONIDAZOLE (FLAGYL) 250 MG CES 1CE',
                'METRONIDAZOLE (FLAGYL) 500 MG CES 1 CE',
                'METRONIDAZOLE COMP',
            ],
        ],
        'cotrimoxazole' => [
            'categories' => ['antibiotiques'],
            'names' => ['BACTRIM (COTRIMOXAZOLE GEN.) 480 MG 1 CE'],
        ],
        'ibuprofene' => [
            'categories' => ['douleur'],
            'names' => ['IBUPROFEN', 'IBUPROFEN 400 MG 10*10 CES 1 CE', 'IBUPROFEN CES 200MG 1CE'],
        ],
        'ibuprofene-sirop' => [
            'categories' => ['douleur', 'enfants'],
            'names' => ['IBUPROFEN SIROP 1FL'],
        ],
        'diclofenac' => [
            'categories' => ['douleur'],
            'names' => ['DICLOFENAC 50 MG 10*10 CES', 'DICLOFENAC 25 MG CES 1CE'],
        ],
        'sro' => [
            'categories' => ['enfants'],
            'names' => ['SERUM S.R.O. 1SCHT', 'ORA-ZINC 1 KIT'],
        ],
        'vitamine-c' => [
            'categories' => ['vitamines'],
            'names' => ['VITAMINE C COMP', 'SCORVITEX (CEVITE)PLQ/10CES 1CE (VIT C CES)'],
        ],
        'multivitamines' => [
            'categories' => ['vitamines'],
            'names' => ['MULTIVIT CES 1CE', 'MULTIVITAMINE CO'],
        ],
        'fer-folique' => [
            'categories' => ['vitamines'],
            'names' => ['FERCEFOL CES (FEFOL CES ) 1CE'],
        ],
    ];

    public function run(): void
    {
        $this->call(CategorySeeder::class);

        $names = $this->readNames();

        $existing = DB::table('medicines')
            ->pluck('name')
            ->mapWithKeys(fn (string $name): array => [$this->key($name) => true])
            ->all();

        $now = now();
        $rows = [];

        foreach ($names as $key => $name) {
            if (isset($existing[$key])) {
                continue;
            }

            $rows[] = [
                'id' => (string) Str::orderedUuid(),
                'name' => $name,
                'units_per_pack' => 1,
                'sale_price_pack' => '0.00',
                'sale_price_unit' => null,
                'min_stock_units' => 0,
                'prescription_required' => false,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::transaction(function () use ($rows): void {
            foreach (array_chunk($rows, self::CHUNK) as $chunk) {
                DB::table('medicines')->insert($chunk);
            }
        });

        $this->command?->info(sprintf(
            'Medicines: %d inserted, %d already present.',
            count($rows),
            count($names) - count($rows),
        ));

        $this->matchProductImages();
    }

    /**
     * Gives the medicines listed in PRODUCT_IMAGES their picture (unless they already have one) and
     * their counter categories.
     */
    private function matchProductImages(): void
    {
        $storePhoto = app(StoreMedicinePhoto::class);
        $categoryIds = Category::query()->pluck('id', 'slug');
        $medicineIds = DB::table('medicines')
            ->pluck('id', 'name')
            ->mapWithKeys(fn (string $id, string $name): array => [$this->key($name) => $id]);

        $matchedCount = 0;

        foreach (self::PRODUCT_IMAGES as $image => ['categories' => $slugs, 'names' => $productNames]) {
            $ids = [];
            foreach ($productNames as $productName) {
                $id = $medicineIds[$this->key($productName)] ?? null;

                if ($id === null) {
                    $this->command?->warn("Image {$image}: no medicine named \"{$productName}\".");

                    continue;
                }

                $ids[] = $id;
            }

            if ($ids === []) {
                continue;
            }

            $contents = file_get_contents(self::IMAGES_DIRECTORY."/{$image}.png");
            if ($contents === false) {
                throw new RuntimeException("Cannot read the image {$image}.png");
            }

            $path = $storePhoto->handle($contents, "medicines/{$image}.webp");
            $categories = collect($slugs)->map(fn (string $slug): ?int => $categoryIds[$slug] ?? null)->filter()->all();

            DB::transaction(function () use ($ids, $path, $categories): void {
                Medicine::query()->whereIn('id', $ids)->whereNull('image_path')->update(['image_path' => $path]);

                foreach (Medicine::query()->whereIn('id', $ids)->get() as $medicine) {
                    $changes = $medicine->categories()->syncWithoutDetaching($categories);

                    // Category links don't change the medicine row; touch it so tablets pull the change.
                    if ($changes['attached'] !== []) {
                        $medicine->touch();
                    }
                }
            });

            $matchedCount += count($ids);
        }

        $this->command?->info("Pictures and categories matched to {$matchedCount} medicines.");
    }

    /**
     * @return array<string, string> normalised key => name as written in the list
     */
    private function readNames(): array
    {
        $handle = fopen(self::FILE, 'rb');

        if ($handle === false) {
            throw new RuntimeException('Cannot open '.self::FILE);
        }

        try {
            $header = fgetcsv($handle);

            if ($header === false || $this->clean((string) ($header[0] ?? '')) !== 'name') {
                throw new RuntimeException('Unexpected header in '.self::FILE.': expected "name".');
            }

            $names = [];

            while (($row = fgetcsv($handle)) !== false) {
                $name = $this->clean((string) ($row[0] ?? ''));

                if ($name === '') {
                    continue;
                }

                $names[$this->key($name)] ??= $name;
            }

            return $names;
        } finally {
            fclose($handle);
        }
    }

    private function clean(string $value): string
    {
        $value = preg_replace('/^\xEF\xBB\xBF/', '', $value) ?? $value; // strip a UTF-8 BOM

        return trim(preg_replace('/\s+/u', ' ', $value) ?? $value);
    }

    private function key(string $name): string
    {
        return mb_strtoupper($this->clean($name), 'UTF-8');
    }
}
