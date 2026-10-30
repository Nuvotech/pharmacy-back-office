<?php

use App\Enums\Role;
use App\Models\Batch;
use App\Models\ExchangeRate;
use App\Models\Medicine;
use App\Models\Reception;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function pharmacist(): User
{
    return User::factory()->role(Role::Pharmacist)->create();
}

/**
 * A two-line USD delivery received on 23/10/2026; both lots expire well after 6 months.
 */
function receptionPayload(array $overrides = []): array
{
    $artemether = Medicine::factory()->create(['name' => 'ARTEMETHER 20/120', 'units_per_pack' => 24]);
    $paracetamol = Medicine::factory()->create(['name' => 'PARACETAMOL 500 MG', 'units_per_pack' => 10]);

    return [
        'supplier_id' => Supplier::factory()->create()->id,
        'invoice_ref' => 'BL-2026-1187',
        'received_on' => '2026-10-23',
        'currency' => 'USD',
        'lines' => [
            ['medicine_id' => $artemether->id, 'lot_number' => 'al-2304', 'expiry' => '2028-08', 'packs' => 20, 'units_per_pack' => 24, 'cost_per_pack' => '4,10'],
            ['medicine_id' => $paracetamol->id, 'lot_number' => 'PC-9021', 'expiry' => '2029-02', 'packs' => 20, 'units_per_pack' => 10, 'cost_per_pack' => '0.18'],
        ],
        ...$overrides,
    ];
}

beforeEach(function () {
    $this->travelTo('2026-10-23 09:40:00');
    ExchangeRate::factory()->create(['rate_date' => '2026-10-20', 'usd_to_cdf' => '2800']);
});

test('cashiers cannot open or save receptions', function () {
    $cashier = User::factory()->role(Role::Cashier)->create();

    $this->actingAs($cashier)->get(route('receptions.create'))->assertForbidden();
    $this->actingAs($cashier)->post(route('receptions.validate'), receptionPayload())->assertForbidden();

    expect(Batch::query()->count())->toBe(0);
});

test('a draft is saved without creating lots and reopens on the reception page', function () {
    $user = pharmacist();

    $this->actingAs($user)
        ->post(route('receptions.draft'), receptionPayload(['supplier_id' => null, 'invoice_ref' => '']))
        ->assertRedirect(route('receptions.create'))
        ->assertSessionHasNoErrors();

    expect(Batch::query()->count())->toBe(0)->and(StockMovement::query()->count())->toBe(0);

    $this->actingAs($user)->get(route('receptions.create'))->assertInertia(fn (Assert $page) => $page
        ->component('receptions/create')
        ->where('reception.status', 'draft')
        ->where('reception.total_cost', '85.60')
        ->where('reception.lines.0.lot_number', 'AL-2304')
        ->where('reception.lines.0.expiry', '2028-08')
        ->where('reception.lines.0.units', 480)
        ->where('reception.lines.0.cost_per_pack', '4.10')
        ->where('exchangeRate', '2800.0000')
        ->has('medicines', 2)
    );
});

test('saving the draft again replaces its lines', function () {
    $user = pharmacist();
    $payload = receptionPayload();
    $this->actingAs($user)->post(route('receptions.draft'), $payload);
    $draft = Reception::query()->sole();

    $this->actingAs($user)->post(route('receptions.draft'), [...$payload, 'id' => $draft->id, 'lines' => [$payload['lines'][1]]]);

    expect(Reception::query()->count())->toBe(1)
        ->and($draft->lines()->count())->toBe(1)
        ->and($draft->fresh()->total_cost)->toBe('3.60');
});

test('validating turns each line into a lot with its units in the stock ledger', function () {
    $user = pharmacist();
    $payload = receptionPayload();

    $this->actingAs($user)
        ->post(route('receptions.validate'), $payload)
        ->assertRedirect(route('receptions.create'))
        ->assertSessionHasNoErrors();

    $reception = Reception::query()->sole();
    $lot = Batch::query()->where('lot_number', 'AL-2304')->sole();

    expect($reception->status->value)->toBe('validated')
        ->and($reception->exchange_rate)->toBe('2800.0000')
        ->and($reception->validated_at)->not->toBeNull()
        ->and($lot->qty_received)->toBe(480)
        ->and($lot->qty_on_hand)->toBe(480)
        ->and($lot->expiry_date->toDateString())->toBe('2028-08-31')
        ->and($lot->reception_id)->toBe($reception->id)
        ->and($lot->supplier_id)->toBe($payload['supplier_id'])
        // 4.10 USD × 2 800 / 24 units
        ->and($lot->purchase_price_unit)->toBe('478.3333')
        ->and(Medicine::query()->withSellableUnits()->pluck('sellable_units', 'name')->all())
        ->toBe(['ARTEMETHER 20/120' => 480, 'PARACETAMOL 500 MG' => 200]);

    $movement = StockMovement::query()->where('batch_id', $lot->id)->sole();
    expect($movement->type->value)->toBe('reception')
        ->and($movement->qty_units)->toBe(480)
        ->and($movement->reference_id)->toBe($reception->id)
        ->and($movement->user_id)->toBe($user->id);

    $this->actingAs($user)->get(route('receptions.create'))
        ->assertInertia(fn (Assert $page) => $page->where('reception', null));
});

test('the box size typed on the line gives the units and corrects the medicine sheet on validation', function () {
    $user = pharmacist();
    $medicine = Medicine::factory()->create(['units_per_pack' => 1]);
    $payload = receptionPayload([
        'currency' => 'CDF',
        'lines' => [
            ['medicine_id' => $medicine->id, 'lot_number' => 'MT-50', 'expiry' => '2029-05', 'packs' => 12, 'units_per_pack' => 50, 'cost_per_pack' => '5000'],
        ],
    ]);

    $this->actingAs($user)->post(route('receptions.draft'), $payload)->assertSessionHasNoErrors();
    expect($medicine->fresh()->units_per_pack)->toBe(1);
    $this->actingAs($user)->get(route('receptions.create'))->assertInertia(fn (Assert $page) => $page
        ->where('reception.lines.0.units_per_pack', 50)
        ->where('reception.lines.0.units', 600)
    );

    $this->actingAs($user)
        ->post(route('receptions.validate'), [...$payload, 'id' => Reception::query()->value('id')])
        ->assertSessionHasNoErrors();

    $lot = Batch::query()->sole();
    expect($lot->qty_received)->toBe(600)
        ->and($lot->qty_on_hand)->toBe(600)
        ->and($lot->purchase_price_unit)->toBe('100.0000')
        ->and($medicine->fresh()->units_per_pack)->toBe(50);
});

test('a CDF invoice keeps its prices without a rate', function () {
    ExchangeRate::query()->delete();
    $payload = receptionPayload(['currency' => 'CDF']);
    $payload['lines'][1]['cost_per_pack'] = '500';

    $this->actingAs(pharmacist())->post(route('receptions.validate'), $payload)->assertSessionHasNoErrors();

    expect(Batch::query()->where('lot_number', 'PC-9021')->value('purchase_price_unit'))->toBe('50.0000')
        ->and(Reception::query()->value('exchange_rate'))->toBeNull();
});

test('a USD invoice is refused when no rate is recorded for the reception date', function () {
    ExchangeRate::query()->delete();

    $this->actingAs(pharmacist())
        ->post(route('receptions.validate'), receptionPayload())
        ->assertSessionHasErrors(['currency' => __('receptions.exchange_rate_missing', locale: 'fr')]);

    expect(Batch::query()->count())->toBe(0)
        ->and(Reception::query()->count())->toBe(0);
});

test('a lot expiring within 6 months must be confirmed before validating', function () {
    $user = pharmacist();
    $payload = receptionPayload();
    $payload['lines'][0]['expiry'] = '2027-03';

    $this->actingAs($user)
        ->post(route('receptions.validate'), $payload)
        ->assertSessionHasErrors(['short_dated_confirmed' => __('receptions.short_dated_not_confirmed', locale: 'fr')]);
    expect(Batch::query()->count())->toBe(0);

    $this->actingAs($user)
        ->post(route('receptions.validate'), [...$payload, 'short_dated_confirmed' => true])
        ->assertSessionHasNoErrors();
    expect(Batch::query()->count())->toBe(2);
});

test('a lot expiring exactly 6 months after the reception is not short-dated', function () {
    $payload = receptionPayload();
    $payload['lines'][0]['expiry'] = '2027-04';

    $this->actingAs(pharmacist())->post(route('receptions.validate'), $payload)->assertSessionHasNoErrors();

    expect(Batch::query()->count())->toBe(2);
});

test('validating needs the supplier, the invoice number and at least one line', function () {
    $this->actingAs(pharmacist())
        ->post(route('receptions.validate'), receptionPayload(['supplier_id' => null, 'invoice_ref' => '', 'lines' => []]))
        ->assertSessionHasErrors([
            'supplier_id' => __('receptions.supplier_required', locale: 'fr'),
            'invoice_ref' => __('receptions.invoice_ref_required', locale: 'fr'),
            'lines' => __('receptions.lines_required', locale: 'fr'),
        ]);
});

test('each line needs a lot, a MM/YYYY expiry, whole boxes, a box size and a price', function () {
    $payload = receptionPayload();
    $payload['lines'][0] = [...$payload['lines'][0], 'lot_number' => '', 'expiry' => '13/2028', 'packs' => 0, 'units_per_pack' => 0, 'cost_per_pack' => 'abc'];

    $this->actingAs(pharmacist())
        ->post(route('receptions.draft'), $payload)
        ->assertSessionHasErrors(['lines.0.lot_number', 'lines.0.expiry', 'lines.0.packs', 'lines.0.units_per_pack', 'lines.0.cost_per_pack']);
});

test('an inactive medicine or supplier cannot be received', function () {
    $payload = receptionPayload(['supplier_id' => Supplier::factory()->inactive()->create()->id]);
    $payload['lines'][0]['medicine_id'] = Medicine::factory()->create(['is_active' => false])->id;

    $this->actingAs(pharmacist())
        ->post(route('receptions.validate'), $payload)
        ->assertSessionHasErrors(['supplier_id', 'lines.0.medicine_id']);
});
