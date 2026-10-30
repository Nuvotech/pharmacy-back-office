<?php

use App\Domain\Receptions\ValidateReception;
use App\Enums\Role;
use App\Models\Category;
use App\Models\Medicine;
use App\Models\Supplier;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function medicinePayload(array $overrides = []): array
{
    return [
        'name' => 'MUTOMBO 50G',
        'dci' => 'Paracétamol',
        'dosage' => '500 mg',
        'form' => 'Comprimé',
        'barcode' => '',
        'shelf' => ' b1 ',
        'units_per_pack' => '50',
        'sale_price_pack' => '2 500',
        'sells_by_unit' => true,
        'sale_price_unit' => '60',
        'min_stock_units' => '100',
        'prescription_required' => false,
        'category_slugs' => [],
        ...$overrides,
    ];
}

function catalogueManager(): User
{
    return User::factory()->role(Role::Pharmacist)->create();
}

test('a seeded medicine opens in the form with its lots in selling order', function () {
    $this->travelTo('2026-10-30 09:00:00');
    $user = catalogueManager();
    $medicine = Medicine::factory()->create(['units_per_pack' => 1, 'sale_price_pack' => '0.00', 'sale_price_unit' => null]);

    foreach ([['LATE', '2029-05'], ['EARLY', '2027-12']] as [$lot, $expiry]) {
        app(ValidateReception::class)->handle($user, [
            'supplier_id' => Supplier::factory()->create()->id,
            'invoice_ref' => "BL-{$lot}",
            'received_on' => '2026-10-30',
            'currency' => 'CDF',
            'lines' => [['medicine_id' => $medicine->id, 'lot_number' => $lot, 'expiry' => $expiry, 'packs' => 2, 'units_per_pack' => 50, 'cost_per_pack' => '5000']],
        ], false);
    }

    $this->actingAs($user)->get(route('medicines.edit', $medicine))->assertInertia(fn (Assert $page) => $page
        ->component('medicines/form')
        ->where('medicine.units_per_pack', 50)
        ->where('medicine.sale_price_pack', '0')
        ->where('medicine.sale_price_unit', null)
        ->has('lots', 2)
        ->where('lots.0.lot_number', 'EARLY')
        ->where('lots.0.expiry', '12/2027')
        ->where('lots.0.qty_on_hand', 100)
        ->where('lots.0.cost_per_pack', '5000')
        ->where('latestCostPerPack', '5000')
    );
});

test('saving the form updates the medicine and touches it for the tablets', function () {
    $this->travelTo('2026-10-30 09:00:00');
    Category::factory()->create(['slug' => 'douleur']);
    $enfants = Category::factory()->create(['slug' => 'enfants']);
    $medicine = Medicine::factory()->create(['units_per_pack' => 1, 'sale_price_pack' => '0.00']);
    $medicine->categories()->attach($enfants);
    $this->travel(1)->minute();

    $this->actingAs(catalogueManager())
        ->patch(route('medicines.update', $medicine), medicinePayload(['category_slugs' => ['douleur', 'enfants']]))
        ->assertRedirect(route('medicines.edit', $medicine))
        ->assertSessionHasNoErrors();

    $medicine->refresh();
    expect($medicine->name)->toBe('MUTOMBO 50G')
        ->and($medicine->units_per_pack)->toBe(50)
        ->and($medicine->shelf)->toBe('B1')
        ->and($medicine->sale_price_pack)->toBe('2500.00')
        ->and($medicine->sale_price_unit)->toBe('60.00')
        ->and($medicine->min_stock_units)->toBe(100)
        ->and($medicine->categories()->pluck('slug')->sort()->values()->all())->toBe(['douleur', 'enfants'])
        ->and($medicine->updated_at->toDateTimeString())->toBe('2026-10-30 09:01:00');
});

test('not selling by the unit clears the unit price', function () {
    $medicine = Medicine::factory()->create();

    $this->actingAs(catalogueManager())
        ->patch(route('medicines.update', $medicine), medicinePayload(['sells_by_unit' => false, 'sale_price_unit' => '60']))
        ->assertSessionHasNoErrors();

    expect($medicine->fresh()->sale_price_unit)->toBeNull();
});

test('a new medicine is created from the form', function () {
    $this->actingAs(catalogueManager())
        ->post(route('medicines.store'), medicinePayload())
        ->assertRedirect(route('medicines.index'))
        ->assertSessionHasNoErrors();

    expect(Medicine::query()->where('name', 'MUTOMBO 50G')->sole())
        ->units_per_pack->toBe(50)
        ->is_active->toBeTrue();
});

test('the form refuses a missing name, a box size of 0, a price with cents and a taken barcode', function () {
    Medicine::factory()->create(['barcode' => '6001234500147']);

    $this->actingAs(catalogueManager())
        ->post(route('medicines.store'), medicinePayload([
            'name' => '',
            'units_per_pack' => '0',
            'sale_price_pack' => '2500,50',
            'barcode' => '6001234500147',
        ]))
        ->assertSessionHasErrors([
            'name' => __('medicines.name_required', locale: 'fr'),
            'units_per_pack' => __('medicines.units_per_pack_min', locale: 'fr'),
            'sale_price_pack' => __('medicines.sale_price_pack_format', locale: 'fr'),
            'barcode' => __('medicines.barcode_taken', locale: 'fr'),
        ]);
});

test('cashiers cannot change the catalogue', function () {
    $cashier = User::factory()->role(Role::Cashier)->create();
    $medicine = Medicine::factory()->create();

    $this->actingAs($cashier)->get(route('medicines.edit', $medicine))->assertForbidden();
    $this->actingAs($cashier)->patch(route('medicines.update', $medicine), medicinePayload())->assertForbidden();

    expect($medicine->fresh()->name)->not->toBe('MUTOMBO 50G');
});
