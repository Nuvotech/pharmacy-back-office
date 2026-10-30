<?php

use App\Domain\Receptions\ValidateReception;
use App\Domain\Stock\RecordStockMovement;
use App\Enums\MovementType;
use App\Enums\Role;
use App\Models\Batch;
use App\Models\Medicine;
use App\Models\Supplier;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

function pullStock(array $query = [])
{
    return test()->getJson(route('api.v1.sync.stock', $query));
}

/**
 * Receives 12 boxes of 50 of a new medicine through the real reception service.
 */
function receiveTwelveBoxes(): Batch
{
    $medicine = Medicine::factory()->create(['units_per_pack' => 1]);

    app(ValidateReception::class)->handle(User::factory()->role(Role::Pharmacist)->create(), [
        'supplier_id' => Supplier::factory()->create()->id,
        'invoice_ref' => 'BL-1',
        'received_on' => now()->toDateString(),
        'currency' => 'CDF',
        'lines' => [
            ['medicine_id' => $medicine->id, 'lot_number' => 'MT-50', 'expiry' => '2029-05', 'packs' => 12, 'units_per_pack' => 50, 'cost_per_pack' => '5000'],
        ],
    ], false);

    return Batch::query()->where('medicine_id', $medicine->id)->sole();
}

beforeEach(function () {
    Sanctum::actingAs(User::factory()->create(), ['counter']);
});

test('the first pull returns every lot with its quantity in units', function () {
    $lot = receiveTwelveBoxes();

    $response = pullStock();

    $response->assertOk()
        ->assertJsonCount(1, 'data.batches')
        ->assertJsonPath('data.batches.0.id', $lot->id)
        ->assertJsonPath('data.batches.0.medicine_id', $lot->medicine_id)
        ->assertJsonPath('data.batches.0.lot_number', 'MT-50')
        ->assertJsonPath('data.batches.0.expiry_date', '2029-05-31')
        ->assertJsonPath('data.batches.0.qty_on_hand', 600)
        ->assertJsonPath('meta.has_more', false);
    expect($response->json('meta.next_cursor'))->toBeString()
        ->and($response->json('meta.server_time'))->toEndWith('Z');
});

test('a reception validated after the last pull comes down on the next one', function () {
    $cursor = pullStock()->json('meta.next_cursor');

    $this->travel(1)->minute();
    $lot = receiveTwelveBoxes();

    pullStock(['cursor' => $cursor])
        ->assertOk()
        ->assertJsonCount(1, 'data.batches')
        ->assertJsonPath('data.batches.0.id', $lot->id);
});

test('a stock movement sends the lot again with its new quantity', function () {
    $lot = receiveTwelveBoxes();
    $other = receiveTwelveBoxes();
    $cursor = pullStock()->json('meta.next_cursor');

    $this->travel(1)->minute();
    app(RecordStockMovement::class)->handle($lot, MovementType::Adjustment, -50, reason: 'Boîte abîmée');

    $response = pullStock(['cursor' => $cursor]);

    $response->assertOk()
        ->assertJsonCount(1, 'data.batches')
        ->assertJsonPath('data.batches.0.id', $lot->id)
        ->assertJsonPath('data.batches.0.qty_on_hand', 550);
    expect($response->json('data.batches.*.id'))->not->toContain($other->id);
});

test('pages follow the cursor without skipping or repeating lots changed in the same second', function () {
    $this->freezeTime();
    $lots = collect(range(1, 5))->map(fn () => receiveTwelveBoxes());

    $first = pullStock(['limit' => 2]);
    $second = pullStock(['limit' => 2, 'cursor' => $first->json('meta.next_cursor')]);
    $third = pullStock(['limit' => 2, 'cursor' => $second->json('meta.next_cursor')]);

    $pulled = collect([$first, $second, $third])->flatMap(fn ($page) => $page->json('data.batches.*.id'));

    expect($third->json('meta.has_more'))->toBeFalse()
        ->and($pulled->sort()->values()->all())->toBe($lots->pluck('id')->sort()->values()->all());
});

test('with nothing new the cursor stays the same', function () {
    receiveTwelveBoxes();
    $cursor = pullStock()->json('meta.next_cursor');

    pullStock(['cursor' => $cursor])
        ->assertJsonCount(0, 'data.batches')
        ->assertJsonPath('meta.next_cursor', $cursor);
});

test('an unreadable cursor is refused so the tablet starts again', function () {
    pullStock(['cursor' => 'not-a-cursor'])
        ->assertUnprocessable()
        ->assertJsonPath('code', 'INVALID_CURSOR');
});

test('stock needs a counter token', function () {
    Sanctum::actingAs(User::factory()->create(), ['back-office']);

    pullStock()->assertForbidden()->assertJsonPath('code', 'FORBIDDEN');
});
