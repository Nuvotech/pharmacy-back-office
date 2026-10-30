<?php

use App\Domain\Stock\RecordStockMovement;
use App\Enums\MovementType;
use App\Enums\Role;
use App\Models\Batch;
use App\Models\Device;
use App\Models\Medicine;
use App\Models\Sale;
use App\Models\StockDiscrepancy;
use App\Models\StockMovement;
use App\Models\SyncEvent;
use App\Models\User;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

/**
 * A lot with stock that went through the ledger, as a validated reception leaves it.
 */
function stockedLot(Medicine $medicine, int $units, string $expiry = '2029-05-31'): Batch
{
    $lot = Batch::query()->create([
        'medicine_id' => $medicine->id,
        'lot_number' => 'LOT-'.Str::upper(Str::random(4)),
        'expiry_date' => $expiry,
        'purchase_price_unit' => '100',
        'qty_received' => $units,
        'received_at' => now()->subMonth(),
    ]);
    app(RecordStockMovement::class)->handle($lot, MovementType::Reception, $units);

    return $lot->fresh();
}

/**
 * One `sale_created` event: 2 boxes of 10 taken from the given lot, paid 5 000 FC cash.
 */
function saleEvent(Medicine $medicine, Batch $lot, array $saleOverrides = []): array
{
    return [
        'id' => (string) Str::uuid(),
        'type' => 'sale_created',
        'created_at' => '2026-10-30T10:15:00+01:00',
        'payload' => [
            'sale' => [
                'id' => (string) Str::uuid(),
                'receipt_no' => 'C1-'.random_int(1000, 999999),
                'user_id' => test()->cashier->id,
                'sold_at' => '2026-10-30T10:15:00+01:00',
                'total' => '5000',
                'currency_paid' => 'CDF',
                'exchange_rate' => '2800',
                'amount_paid' => '5000',
                'change_given' => '0',
                'payment_method' => 'cash',
                'payment_ref' => null,
                'prescriber' => null,
                'patient_name' => null,
                'lines' => [
                    [
                        'medicine_id' => $medicine->id,
                        'sell_mode' => 'pack',
                        'quantity' => 2,
                        'units_per_pack' => 10,
                        'unit_price' => '2500',
                        'lots' => [['batch_id' => $lot->id, 'units' => 20]],
                    ],
                ],
                ...$saleOverrides,
            ],
        ],
    ];
}

function push(array $events)
{
    return test()->postJson(route('api.v1.sync.push'), ['events' => $events]);
}

beforeEach(function () {
    $this->travelTo('2026-10-30 12:00:00');
    $this->cashier = User::factory()->role(Role::Cashier)->create();
    Sanctum::actingAs($this->cashier, ['counter']);
    $this->medicine = Medicine::factory()->create(['units_per_pack' => 10]);
});

test('a sale pushed from the tablet is recorded and its units leave the lot it was sold from', function () {
    $lot = stockedLot($this->medicine, 100);
    $event = saleEvent($this->medicine, $lot);

    push([$event])
        ->assertOk()
        ->assertJsonPath('data.results.0', ['id' => $event['id'], 'status' => 'applied', 'error' => null])
        ->assertJsonPath('data.batches', [['id' => $lot->id, 'qty_on_hand' => 80]]);

    $sale = Sale::query()->sole();
    expect($sale->id)->toBe($event['payload']['sale']['id'])
        ->and($sale->user_id)->toBe($this->cashier->id)
        ->and($sale->total)->toBe('5000.00')
        ->and($sale->sold_at->toDateTimeString())->toBe('2026-10-30 09:15:00')
        ->and($sale->device_id)->toBe(Device::query()->sole()->id)
        ->and($sale->items()->sole()->only(['batch_id', 'sell_mode', 'quantity', 'qty_units', 'line_total']))
        ->toBe(['batch_id' => $lot->id, 'sell_mode' => 'pack', 'quantity' => 2, 'qty_units' => 20, 'line_total' => '5000.00'])
        ->and(StockMovement::query()->where('type', MovementType::Sale)->sole()->qty_units)->toBe(-20)
        ->and(SyncEvent::query()->sole()->status)->toBe('applied');
});

test('the same event pushed twice sells the stock once', function () {
    $lot = stockedLot($this->medicine, 100);
    $event = saleEvent($this->medicine, $lot);

    push([$event])->assertOk();
    push([$event])->assertOk()->assertJsonPath('data.results.0.status', 'duplicate');

    expect(Sale::query()->count())->toBe(1)
        ->and($lot->fresh()->qty_on_hand)->toBe(80);
});

test('when the lot sold is short on the server, the rest comes from the next lot to expire', function () {
    $soldLot = stockedLot($this->medicine, 5, '2027-06-30');
    $later = stockedLot($this->medicine, 50, '2029-01-31');
    $next = stockedLot($this->medicine, 50, '2028-01-31');

    push([saleEvent($this->medicine, $soldLot)])->assertOk();

    expect($soldLot->fresh()->qty_on_hand)->toBe(0)
        ->and($next->fresh()->qty_on_hand)->toBe(35)
        ->and($later->fresh()->qty_on_hand)->toBe(50)
        ->and(StockMovement::query()->where('type', MovementType::SyncReallocation)->sole()->qty_units)->toBe(-15)
        ->and(StockDiscrepancy::query()->count())->toBe(0);
});

test('units no lot can cover become a stock discrepancy for the pharmacist', function () {
    $soldLot = stockedLot($this->medicine, 5);

    push([saleEvent($this->medicine, $soldLot)])->assertOk()->assertJsonPath('data.results.0.status', 'applied');

    expect($soldLot->fresh()->qty_on_hand)->toBe(0)
        ->and(StockDiscrepancy::query()->sole()->only(['batch_id', 'qty_short_units', 'status']))
        ->toBe(['batch_id' => $soldLot->id, 'qty_short_units' => 15, 'status' => 'open']);
});

test('a bad event fails on its own and the others in the batch are applied', function () {
    $lot = stockedLot($this->medicine, 100);
    $bad = saleEvent($this->medicine, $lot, ['lines' => []]);
    $good = saleEvent($this->medicine, $lot);

    $response = push([$bad, $good])->assertOk();

    expect($response->json('data.results.0.status'))->toBe('failed')
        ->and($response->json('data.results.0.error'))->toStartWith('invalid_payload')
        ->and($response->json('data.results.1.status'))->toBe('applied')
        ->and(Sale::query()->count())->toBe(1)
        ->and(SyncEvent::query()->find($bad['id'])?->status)->toBe('failed');
});

test('a receipt number already used by another sale is refused', function () {
    $lot = stockedLot($this->medicine, 100);
    push([saleEvent($this->medicine, $lot, ['receipt_no' => 'C1-0458'])]);

    push([saleEvent($this->medicine, $lot, ['receipt_no' => 'C1-0458'])])
        ->assertJsonPath('data.results.0', fn (array $result) => $result['status'] === 'failed' && $result['error'] === 'receipt_no_taken');

    expect(Sale::query()->count())->toBe(1);
});

test('a push records when the device last synced and who was signed in', function () {
    push([])->assertOk()->assertJsonPath('data.results', []);

    $device = Device::query()->sole();
    expect($device->last_sync_at?->toDateTimeString())->toBe('2026-10-30 12:00:00')
        ->and($device->last_user_id)->toBe($this->cashier->id);
});

test('more than 200 events are refused', function () {
    $events = array_map(fn () => ['id' => (string) Str::uuid(), 'type' => 'sale_created', 'created_at' => now()->toIso8601String(), 'payload' => ['x' => 1]], range(1, 201));

    push($events)->assertUnprocessable()->assertJsonPath('code', 'VALIDATION_FAILED');
});

test('pushing needs a counter token', function () {
    Sanctum::actingAs($this->cashier, ['back-office']);

    push([])->assertForbidden();
});
