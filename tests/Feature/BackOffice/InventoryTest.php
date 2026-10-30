<?php

use App\Domain\Stock\RecordStockMovement;
use App\Enums\MovementType;
use App\Enums\Role;
use App\Models\Batch;
use App\Models\InventoryCount;
use App\Models\InventoryCountLine;
use App\Models\Medicine;
use App\Models\StockMovement;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function countedLot(string $medicineName, string $lotNumber, int $units, ?string $shelf = null): Batch
{
    $lot = Batch::query()->create([
        'medicine_id' => Medicine::factory()->create(['name' => $medicineName, 'shelf' => $shelf])->id,
        'lot_number' => $lotNumber,
        'expiry_date' => '2027-11-30',
        'purchase_price_unit' => '100',
        'qty_received' => $units,
        'received_at' => now()->subMonth(),
    ]);
    app(RecordStockMovement::class)->handle($lot, MovementType::Reception, $units);

    return $lot->fresh();
}

function inventoryManager(): User
{
    return User::factory()->role(Role::Pharmacist)->create();
}

beforeEach(function () {
    $this->travelTo('2026-10-30 07:30:00');
});

test('with no count open the page offers to start one', function () {
    $this->actingAs(inventoryManager())->get(route('inventory.index'))->assertInertia(fn (Assert $page) => $page
        ->component('inventory/index')
        ->where('count', null)
        ->where('lines', [])
    );
});

test('starting a count lists every lot with stock and what the system expects', function () {
    countedLot('PARACETAMOL 500 MG', 'PC-8810', 340);
    countedLot('AMOXICILLINE 500 MG', 'AX-0412', 120);
    $empty = countedLot('VIDE', 'EMPTY-1', 5);
    app(RecordStockMovement::class)->handle($empty, MovementType::Adjustment, -5);
    $user = inventoryManager();

    $this->actingAs($user)->post(route('inventory.store'))->assertRedirect(route('inventory.index'));

    $this->actingAs($user)->get(route('inventory.index'))->assertInertia(fn (Assert $page) => $page
        ->where('count.started_at', '2026-10-30T07:30:00Z')
        ->has('lines', 2)
        ->where('lines.0.medicine', 'AMOXICILLINE 500 MG')
        ->where('lines.0.lot_number', 'AX-0412')
        ->where('lines.0.expiry', '11/2027')
        ->where('lines.0.expected_units', 120)
        ->where('lines.0.counted_units', null)
        ->where('lines.0.unit_cost', '100.0000')
    );
});

test('lots are listed shelf by shelf, those without a shelf last, and the sheet prints in that order', function () {
    countedLot('ZINC', 'Z-1', 10, 'A1');
    countedLot('AMOXICILLINE', 'AX-1', 10, 'B2');
    countedLot('PARACETAMOL', 'PC-1', 10);
    countedLot('IBUPROFENE', 'IB-1', 10, 'A1');
    $user = inventoryManager();
    $this->actingAs($user)->post(route('inventory.store'));

    $this->actingAs($user)->get(route('inventory.index'))->assertInertia(fn (Assert $page) => $page
        ->where('lines.0.medicine', 'IBUPROFENE')
        ->where('lines.0.shelf', 'A1')
        ->where('lines.1.medicine', 'ZINC')
        ->where('lines.2.shelf', 'B2')
        ->where('lines.3.medicine', 'PARACETAMOL')
        ->where('lines.3.shelf', null)
    );

    $this->actingAs($user)
        ->get(route('inventory.print', InventoryCount::query()->sole()))
        ->assertOk()
        ->assertSeeInOrder(['Feuille de comptage', 'A1', 'IBUPROFENE', 'ZINC', 'B2', 'AMOXICILLINE', 'PARACETAMOL']);
});

test('only one count can be open at a time', function () {
    $user = inventoryManager();
    $this->actingAs($user)->post(route('inventory.store'));

    $this->actingAs($user)
        ->post(route('inventory.store'))
        ->assertSessionHasErrors(['count' => __('inventory.already_open', locale: 'fr')]);

    expect(InventoryCount::query()->count())->toBe(1);
});

test('a counted quantity is saved, and a blank one goes back to "à compter"', function () {
    countedLot('PARACETAMOL 500 MG', 'PC-8810', 340);
    $user = inventoryManager();
    $this->actingAs($user)->post(route('inventory.store'));
    $line = InventoryCountLine::query()->sole();

    $this->actingAs($user)->patch(route('inventory.lines.update', $line), ['counted_units' => '1 330'])->assertSessionHasNoErrors();
    expect($line->fresh()->counted_units)->toBe(1330);

    $this->actingAs($user)->patch(route('inventory.lines.update', $line), ['counted_units' => ''])->assertSessionHasNoErrors();
    expect($line->fresh()->counted_units)->toBeNull();

    $this->actingAs($user)
        ->patch(route('inventory.lines.update', $line), ['counted_units' => '-3'])
        ->assertSessionHasErrors(['counted_units' => __('inventory.counted_format', locale: 'fr')]);
});

test('closing posts each difference as a correction signed by the user; uncounted lots keep their quantity', function () {
    $short = countedLot('PARACETAMOL 500 MG', 'PC-8810', 340);
    $exact = countedLot('PARACETAMOL 500 MG', 'PC-8902', 800);
    $over = countedLot('IBUPROFENE 400 MG', 'IB-2210', 400);
    $uncounted = countedLot('VITAMINE C', 'VC-0211', 120);
    $user = inventoryManager();
    $this->actingAs($user)->post(route('inventory.store'));
    $count = InventoryCount::query()->sole();

    foreach ([[$short, 330], [$exact, 800], [$over, 412]] as [$lot, $counted]) {
        $line = InventoryCountLine::query()->where('batch_id', $lot->id)->sole();
        $this->actingAs($user)->patch(route('inventory.lines.update', $line), ['counted_units' => (string) $counted]);
    }

    $this->actingAs($user)->post(route('inventory.close', $count))->assertRedirect(route('inventory.index'));

    expect($short->fresh()->qty_on_hand)->toBe(330)
        ->and($exact->fresh()->qty_on_hand)->toBe(800)
        ->and($over->fresh()->qty_on_hand)->toBe(412)
        ->and($uncounted->fresh()->qty_on_hand)->toBe(120)
        ->and($count->fresh()->status)->toBe('closed');

    $corrections = StockMovement::query()->where('type', MovementType::InventoryCorrection)->orderBy('qty_units')->get();
    expect($corrections->pluck('qty_units')->all())->toBe([-10, 12])
        ->and($corrections->pluck('user_id')->unique()->all())->toBe([$user->id])
        ->and($corrections->first()->reason)->toBe('Inventaire du 30/10/2026')
        ->and($corrections->first()->reference_id)->toBe($count->id);
});

test('a closed count can no longer be changed or closed again', function () {
    countedLot('PARACETAMOL 500 MG', 'PC-8810', 340);
    $user = inventoryManager();
    $this->actingAs($user)->post(route('inventory.store'));
    $count = InventoryCount::query()->sole();
    $this->actingAs($user)->post(route('inventory.close', $count));

    $this->actingAs($user)
        ->patch(route('inventory.lines.update', InventoryCountLine::query()->sole()), ['counted_units' => '1'])
        ->assertSessionHasErrors('counted_units');
    $this->actingAs($user)->post(route('inventory.close', $count))->assertSessionHasErrors('count');
});

test('cashiers cannot run a count', function () {
    $cashier = User::factory()->role(Role::Cashier)->create();

    $this->actingAs($cashier)->get(route('inventory.index'))->assertForbidden();
    $this->actingAs($cashier)->post(route('inventory.store'))->assertForbidden();
});
