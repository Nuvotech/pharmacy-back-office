<?php

use App\Domain\Stock\RecordStockMovement;
use App\Enums\MovementType;
use App\Models\Batch;
use App\Models\Medicine;
use App\Models\User;

function emptyLot(): Batch
{
    return Batch::query()->create([
        'medicine_id' => Medicine::factory()->create()->id,
        'lot_number' => 'AL-2304',
        'expiry_date' => '2028-08-31',
        'purchase_price_unit' => '0',
        'qty_received' => 0,
        'received_at' => now(),
    ]);
}

test('a movement is appended and the lot quantity follows it', function () {
    $batch = emptyLot();
    $user = User::factory()->create();
    $ledger = app(RecordStockMovement::class);

    $ledger->handle($batch, MovementType::Reception, 480, $user, ['type' => 'reception', 'id' => 'f0e4c2f7-0000-4000-8000-000000000001']);
    $ledger->handle($batch, MovementType::Sale, -24);

    expect($batch->fresh()->qty_on_hand)->toBe(456)
        ->and($batch->movements()->orderBy('qty_units', 'desc')->get(['type', 'qty_units', 'user_id', 'reference_type'])->toArray())
        ->toBe([
            ['type' => 'reception', 'qty_units' => 480, 'user_id' => $user->id, 'reference_type' => 'reception'],
            ['type' => 'sale', 'qty_units' => -24, 'user_id' => null, 'reference_type' => null],
        ]);
});

test('a zero movement is refused and changes nothing', function () {
    $batch = emptyLot();

    expect(fn () => app(RecordStockMovement::class)->handle($batch, MovementType::Adjustment, 0))
        ->toThrow(InvalidArgumentException::class);

    expect($batch->movements()->count())->toBe(0)
        ->and($batch->fresh()->qty_on_hand)->toBe(0);
});
