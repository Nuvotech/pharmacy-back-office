<?php

use App\Http\Controllers\BackOffice\MedicineController;
use App\Models\Category;
use App\Models\Medicine;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

test('the list shows medicines from the database with stock computed on the server', function () {
    $category = Category::factory()->create(['slug' => 'douleur', 'name' => 'Douleur']);
    $medicine = Medicine::factory()
        ->withLot(184)
        ->withLot(500, now()->subDay()) // expired: not sellable
        ->create([
            'name' => 'PARACETAMOL 500 MG CES 1CE',
            'units_per_pack' => 10,
            'sale_price_pack' => '1000.00',
            'min_stock_units' => 50,
            'image_path' => 'medicines/paracetamol.webp',
        ]);
    $medicine->categories()->attach($category);

    $response = $this->get(route('medicines.index'));

    $response->assertInertia(fn (Assert $page) => $page
        ->component('medicines/index')
        ->where('activeCount', 1)
        ->has('medicines.data', 1)
        ->where('medicines.data.0.name', 'PARACETAMOL 500 MG CES 1CE')
        ->where('medicines.data.0.categories', ['Douleur'])
        ->where('medicines.data.0.sale_price_pack', '1000.00')
        ->where('medicines.data.0.sellable_units', 184)
        ->where('medicines.data.0.sellable_packs', 18)
        ->where('medicines.data.0.stock_status', 'ok')
        ->where('medicines.data.0.image_url', asset('storage/medicines/paracetamol.webp'))
        ->where('categories.0.slug', 'douleur')
    );
});

test('stock status is out with no sellable units and low at or below the minimum', function (int $units, string $status) {
    Medicine::factory()->withLot($units)->create(['min_stock_units' => 50]);

    $this->get(route('medicines.index'))->assertInertia(fn (Assert $page) => $page
        ->where('medicines.data.0.stock_status', $status)
    );
})->with([
    'none' => [0, 'out'],
    'at the minimum' => [50, 'low'],
    'above the minimum' => [51, 'ok'],
]);

test('search matches the name, the DCI or the barcode', function (string $search) {
    Medicine::factory()->create(['name' => 'DOLIPRANE 500 MG', 'dci' => 'Paracétamol', 'barcode' => '6001234500017']);
    Medicine::factory()->create(['name' => 'QUININE 300MG']);

    $this->get(route('medicines.index', ['search' => $search]))->assertInertia(fn (Assert $page) => $page
        ->has('medicines.data', 1)
        ->where('medicines.data.0.name', 'DOLIPRANE 500 MG')
        ->where('filters.search', $search)
    );
})->with(['name' => ['doliprane'], 'DCI' => ['Paracétamol'], 'barcode with spaces' => ['6 001234 500017']]);

test('the category filter keeps the medicines of that category', function () {
    $paludisme = Category::factory()->create(['slug' => 'paludisme']);
    Medicine::factory()->create(['name' => 'QUININE 300MG'])->categories()->attach($paludisme);
    Medicine::factory()->create(['name' => 'IBUPROFEN']);

    $this->get(route('medicines.index', ['category' => 'paludisme']))->assertInertia(fn (Assert $page) => $page
        ->has('medicines.data', 1)
        ->where('medicines.data.0.name', 'QUININE 300MG')
    );
});

test('the chips keep out-of-stock, low-stock or prescription medicines', function (string $filter, string $expected) {
    Medicine::factory()->create(['name' => 'A RUPTURE', 'min_stock_units' => 50]);
    Medicine::factory()->withLot(10)->create(['name' => 'B STOCK BAS', 'min_stock_units' => 50]);
    Medicine::factory()->withLot(500)->prescriptionRequired()->create(['name' => 'C ORDONNANCE', 'min_stock_units' => 50]);

    $this->get(route('medicines.index', ['filter' => $filter]))->assertInertia(fn (Assert $page) => $page
        ->has('medicines.data', 1)
        ->where('medicines.data.0.name', $expected)
    );
})->with([
    'ruptures' => ['out', 'A RUPTURE'],
    'stock bas' => ['low', 'B STOCK BAS'],
    'ordonnance' => ['prescription', 'C ORDONNANCE'],
]);

test('an unknown filter or category shows the whole list', function () {
    Medicine::factory()->count(2)->create();

    $this->get(route('medicines.index', ['filter' => 'nope', 'category' => 'inconnue']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('medicines.data', 2)
            ->where('filters.filter', 'all')
            ->where('filters.category', '')
        );
});

test('deactivated medicines are not listed', function () {
    Medicine::factory()->create(['is_active' => false]);

    $this->get(route('medicines.index'))->assertInertia(fn (Assert $page) => $page
        ->has('medicines.data', 0)
        ->where('activeCount', 0)
    );
});

test('the list is paginated and keeps the filters on the next page', function () {
    Medicine::factory()->count(MedicineController::PER_PAGE + 1)->prescriptionRequired()->create();

    $this->get(route('medicines.index', ['filter' => 'prescription']))->assertInertia(fn (Assert $page) => $page
        ->has('medicines.data', MedicineController::PER_PAGE)
        ->where('medicines.meta.total', MedicineController::PER_PAGE + 1)
        ->where('medicines.links.next', fn (string $url) => str_contains($url, 'filter=prescription') && str_contains($url, 'page=2'))
    );
});
