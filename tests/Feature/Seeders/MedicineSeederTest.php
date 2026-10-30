<?php

use App\Domain\Catalogue\StoreMedicinePhoto;
use App\Models\Category;
use App\Models\Medicine;
use Database\Seeders\MedicineSeeder;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
});

function medicineNamed(string $name): Medicine
{
    return Medicine::query()->where('name', $name)->sole();
}

test('it seeds the PHARMAPLUS list and the five counter categories', function () {
    $this->seed(MedicineSeeder::class);

    expect(Medicine::count())->toBe(1745)
        ->and(Category::query()->orderBy('sort_order')->pluck('name')->all())
        ->toBe(['Paludisme', 'Antibiotiques', 'Douleur', 'Enfants', 'Vitamines']);
});

test('every name listed for a picture exists in the PHARMAPLUS list', function () {
    $this->seed(MedicineSeeder::class);

    $listed = collect(MedicineSeeder::PRODUCT_IMAGES)->flatMap(fn (array $image) => $image['names']);

    expect(Medicine::query()->whereNotNull('image_path')->count())->toBe($listed->count());
});

test('matched medicines get the picture as a WebP of at most 400 px and the counter categories', function () {
    $this->seed(MedicineSeeder::class);

    $tablets = medicineNamed('PARACETAMOL 500 MG CES 1CE');
    $syrup = medicineNamed('PARACETAMOL SIROP 1FL');

    expect($tablets->image_path)->toBe('medicines/paracetamol.webp')
        ->and($tablets->categories->pluck('slug')->all())->toBe(['douleur'])
        ->and($syrup->image_path)->toBe('medicines/paracetamol-sirop.webp')
        ->and($syrup->categories->pluck('slug')->all())->toBe(['douleur', 'enfants']);

    $size = getimagesizefromstring(Storage::disk('public')->get('medicines/paracetamol.webp'));
    expect($size['mime'])->toBe('image/webp')
        ->and(max($size[0], $size[1]))->toBeLessThanOrEqual(StoreMedicinePhoto::MAX_SIZE_PX);
});

test('medicines without a picture keep no image and no category', function () {
    $this->seed(MedicineSeeder::class);

    $medicine = medicineNamed('ABIRATERONE 500mg');

    expect($medicine->image_path)->toBeNull()
        ->and($medicine->categories)->toBeEmpty();
});

test('running it again adds nothing and keeps photos and categories set in the back office', function () {
    $this->seed(MedicineSeeder::class);
    $medicine = medicineNamed('QUININE 300MG');
    $medicine->update(['image_path' => 'medicines/real-photo.webp']);
    $vitamines = Category::query()->where('slug', 'vitamines')->sole();
    $medicine->categories()->attach($vitamines);

    $this->seed(MedicineSeeder::class);

    $medicine->refresh();
    expect(Medicine::count())->toBe(1745)
        ->and(Category::count())->toBe(5)
        ->and($medicine->image_path)->toBe('medicines/real-photo.webp')
        ->and($medicine->categories->pluck('slug')->all())->toBe(['paludisme', 'vitamines']);
});
