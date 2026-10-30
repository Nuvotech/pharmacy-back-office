<?php

use App\Domain\Receptions\ValidateReception;
use App\Domain\Stock\RecordStockMovement;
use App\Enums\MovementType;
use App\Enums\Role;
use App\Models\Batch;
use App\Models\Device;
use App\Models\ExchangeRate;
use App\Models\Medicine;
use App\Models\Sale;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * A lot through the ledger, bought at 100 FC per unit.
 */
function dashboardLot(Medicine $medicine, int $units, string $expiry): Batch
{
    $lot = Batch::query()->create([
        'medicine_id' => $medicine->id,
        'lot_number' => 'L-'.Str::upper(Str::random(4)),
        'expiry_date' => $expiry,
        'purchase_price_unit' => '100',
        'qty_received' => $units,
        'received_at' => now()->subMonth(),
    ]);
    app(RecordStockMovement::class)->handle($lot, MovementType::Reception, $units);

    return $lot;
}

function dashboardSale(string $soldAt, string $total): void
{
    Sale::query()->create([
        'id' => (string) Str::uuid(),
        'receipt_no' => 'C1-'.Str::random(6),
        'total' => $total,
        'currency_paid' => 'CDF',
        'exchange_rate' => '2800',
        'amount_paid' => $total,
        'payment_method' => 'cash',
        'sold_at' => $soldAt,
    ]);
}

beforeEach(function () {
    $this->travelTo('2026-10-30 12:00:00');
});

test('the dashboard shows today\'s sales, stock value, alert counts, receptions and devices', function () {
    $user = User::factory()->role(Role::Pharmacist)->create();
    ExchangeRate::factory()->create(['rate_date' => '2026-10-30', 'usd_to_cdf' => '2800']);

    $ok = Medicine::factory()->create(['min_stock_units' => 10]);
    dashboardLot($ok, 100, '2028-01-31');
    $low = Medicine::factory()->create(['name' => 'BAS', 'min_stock_units' => 50]);
    dashboardLot($low, 20, '2026-12-31');
    $out = Medicine::factory()->create(['name' => 'EPUISE', 'min_stock_units' => 5]);
    dashboardLot($out, 30, '2026-10-15');
    Medicine::factory()->create(['name' => 'JAMAIS RECU', 'min_stock_units' => 0]);

    dashboardSale('2026-10-30 08:00:00', '5000');
    dashboardSale('2026-10-30 11:30:00', '2500');
    dashboardSale('2026-10-29 18:00:00', '9000');

    app(ValidateReception::class)->handle($user, [
        'supplier_id' => Supplier::factory()->create(['name' => '[GROSSISTE A]'])->id,
        'invoice_ref' => 'BL-2026-1187',
        'received_on' => '2026-10-30',
        'currency' => 'CDF',
        'lines' => [['medicine_id' => $ok->id, 'lot_number' => 'NEW', 'expiry' => '2029-01', 'packs' => 1, 'units_per_pack' => 10, 'cost_per_pack' => '1000']],
    ], false);

    $cashier = User::factory()->role(Role::Cashier)->create(['name' => 'Grâce M.']);
    Device::query()->create(['name' => 'Caisse 1', 'last_sync_at' => now()->subMinute(), 'last_user_id' => $cashier->id]);
    Device::query()->create(['name' => 'Caisse 2', 'last_sync_at' => now()->subHour()]);

    $this->actingAs($user)->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page
        ->component('dashboard')
        ->where('exchangeRate', '2800.0000')
        ->where('summary.sales_today', ['total' => '7500.00', 'tickets' => 2])
        // 100 + 10 + 20 units at 100 FC; the expired lot is not counted.
        ->where('summary.stock_value', '13000.00')
        ->where('summary.counts', ['out' => 2, 'low' => 1, 'expiring' => 1, 'expired' => 1])
        ->where('summary.alerts.0.name', 'EPUISE')
        ->where('summary.alerts.0.detail', 'Stock épuisé')
        ->where('summary.alerts.1.name', 'JAMAIS RECU')
        ->where('summary.alerts.1.detail', 'Aucun lot reçu')
        ->where('summary.alerts.2.kind', 'low')
        ->where('summary.alerts.2.stock', 20)
        ->where('summary.alerts.3.kind', 'expiring')
        ->where('summary.alerts.3.detail', 'Expire le 31/12/2026')
        ->where('summary.alerts.4.kind', 'expired')
        ->where('summary.receptions.0', fn ($reception) => $reception['reference'] === 'BL-2026-1187'
            && $reception['supplier'] === '[GROSSISTE A]'
            && $reception['line_count'] === 1)
        ->where('summary.devices.0.name', 'Caisse 1')
        ->where('summary.devices.0.user_name', 'Grâce M.')
        ->where('summary.devices.0.is_online', true)
        ->where('summary.devices.1.user_name', null)
        ->where('summary.devices.1.is_online', false)
    );
});

test('guests are sent to the login page', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});
