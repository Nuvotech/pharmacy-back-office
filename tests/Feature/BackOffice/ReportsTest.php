<?php

use App\Domain\Stock\RecordStockMovement;
use App\Enums\MovementType;
use App\Enums\Role;
use App\Models\Batch;
use App\Models\Medicine;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

function reportLot(Medicine $medicine, int $units, string $expiry, string $unitCost = '100'): Batch
{
    $lot = Batch::query()->create([
        'medicine_id' => $medicine->id,
        'lot_number' => 'L-'.Str::upper(Str::random(4)),
        'expiry_date' => $expiry,
        'purchase_price_unit' => $unitCost,
        'qty_received' => $units,
        'received_at' => now()->subYear(),
    ]);
    app(RecordStockMovement::class)->handle($lot, MovementType::Reception, $units);

    return $lot;
}

/**
 * A synced sale of whole boxes of one lot.
 */
function reportSale(Batch $lot, string $soldAt, int $packs, int $unitsPerPack, string $boxPrice, string $method = 'cash', string $status = 'completed'): void
{
    $total = bcmul((string) $packs, $boxPrice, 2);
    $sale = Sale::query()->create([
        'id' => (string) Str::uuid(),
        'receipt_no' => 'C1-'.Str::random(8),
        'total' => $total,
        'currency_paid' => 'CDF',
        'exchange_rate' => '2800',
        'amount_paid' => $total,
        'payment_method' => $method,
        'status' => $status,
        'sold_at' => $soldAt,
        'synced_at' => $soldAt,
    ]);
    SaleItem::query()->create([
        'sale_id' => $sale->id,
        'medicine_id' => $lot->medicine_id,
        'batch_id' => $lot->id,
        'sell_mode' => 'pack',
        'quantity' => $packs,
        'qty_units' => $packs * $unitsPerPack,
        'unit_price' => $boxPrice,
        'line_total' => $total,
    ]);

    if ($status !== 'returned') {
        app(RecordStockMovement::class)->handle($lot->fresh(), MovementType::Sale, -$packs * $unitsPerPack);
    }
}

function reportsUser(): User
{
    return User::factory()->role(Role::Pharmacist)->create();
}

beforeEach(function () {
    $this->travelTo('2026-10-23 10:41:00');
    $this->paracetamol = Medicine::factory()->create(['name' => 'PARACETAMOL 500 MG', 'units_per_pack' => 10]);
    $this->amoxicilline = Medicine::factory()->create(['name' => 'AMOXICILLINE 500 MG', 'units_per_pack' => 10]);
    $this->paracetamolLot = reportLot($this->paracetamol, 500, '2028-01-31');
    $this->amoxicillineLot = reportLot($this->amoxicilline, 300, '2028-01-31');
});

test('the sales report shows the month so far, per day and payment method, with the best sellers', function () {
    reportSale($this->paracetamolLot, '2026-10-01 09:00:00', 2, 10, '1000');
    reportSale($this->paracetamolLot, '2026-10-01 15:00:00', 1, 10, '1000', 'mobile_money');
    reportSale($this->amoxicillineLot, '2026-10-22 11:00:00', 3, 10, '2500');
    reportSale($this->amoxicillineLot, '2026-10-22 12:00:00', 1, 10, '2500', 'cash', 'returned');
    reportSale($this->paracetamolLot, '2026-09-30 18:00:00', 5, 10, '1000');

    $this->actingAs(reportsUser())->get(route('reports.sales'))->assertInertia(fn (Assert $page) => $page
        ->component('reports/sales')
        ->where('months.0', '2026-10')
        ->where('months.1', '2026-09')
        ->where('report.month', '2026-10')
        ->has('report.days', 23)
        ->where('report.days.0', ['date' => '2026-10-01', 'day' => 1, 'cash' => '2000.00', 'mobile_money' => '1000.00'])
        ->where('report.days.21.cash', '7500.00')
        ->where('report.total', '10500.00')
        ->where('report.mobile_money', '1000.00')
        ->where('report.tickets', 3)
        ->where('report.best_sellers.0.medicine', 'AMOXICILLINE 500 MG')
        ->where('report.best_sellers.0.packs', 3)
        ->where('report.best_sellers.0.revenue', '7500.00')
        ->where('report.best_sellers.1.revenue', '3000.00')
        ->where('report.synced_until', '2026-10-22T12:00:00Z')
    );
});

test('a past month covers the whole month', function () {
    reportSale($this->paracetamolLot, '2026-09-30 18:00:00', 5, 10, '1000');

    $this->actingAs(reportsUser())->get(route('reports.sales', ['month' => '2026-09']))->assertInertia(fn (Assert $page) => $page
        ->where('report.month', '2026-09')
        ->has('report.days', 30)
        ->where('report.total', '5000.00')
    );
});

test('the consumption report gives the monthly use, the cover and the boxes to order', function () {
    // 60 units sold in October, 30 in August: average 15 units a month over 6 months.
    reportSale($this->paracetamolLot, '2026-10-02 10:00:00', 6, 10, '1000');
    reportSale($this->paracetamolLot, '2026-08-15 10:00:00', 3, 10, '1000');
    reportLot($this->paracetamol, 20, '2026-10-01');
    reportLot($this->amoxicilline, 10, '2026-11-15', '50');

    $this->actingAs(reportsUser())->get(route('reports.consumption'))->assertInertia(fn (Assert $page) => $page
        ->component('reports/consumption')
        ->where('report.months', ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'])
        ->has('report.rows', 1)
        ->where('report.rows.0.medicine', 'PARACETAMOL 500 MG')
        ->where('report.rows.0.months', [0, 0, 0, 30, 0, 60])
        ->where('report.rows.0.average', 15)
        ->where('report.rows.0.stock', 410)
        ->where('report.rows.0.cover_months', 27.3)
        ->where('report.rows.0.order_packs', 0)
        // The 20 expired units at 100 FC, then November's lot (10 units at 50 FC).
        ->where('report.expiring.0.is_expired', true)
        ->where('report.expiring.0.value', '2000.00')
        ->where('report.expiring.1.month', '2026-10')
        ->where('report.expiring.1.value', '0.00')
        ->where('report.expiring.2.month', '2026-11')
        ->where('report.expiring.2.value', '500.00')
        ->where('report.expiring.2.first_lot.units', 10)
    );
});

test('a medicine running low is suggested for order in whole boxes', function () {
    $quinine = Medicine::factory()->create(['name' => 'QUININE', 'units_per_pack' => 12]);
    $lot = reportLot($quinine, 130, '2028-01-31');
    reportSale($lot, '2026-10-02 10:00:00', 10, 12, '3000');

    $this->actingAs(reportsUser())->get(route('reports.consumption'))->assertInertia(fn (Assert $page) => $page
        // 120 units in 6 months = 20 a month; 2 months = 40; stock 10 → 30 units → 3 boxes of 12.
        ->where('report.rows.0.medicine', 'QUININE')
        ->where('report.rows.0.order_packs', 3)
        ->where('report.rows.0.order_units', 36)
    );
});

test('the reports export to Excel', function () {
    $user = reportsUser();
    reportSale($this->paracetamolLot, '2026-10-01 09:00:00', 2, 10, '1000');

    $this->actingAs($user)->get(route('reports.sales.export', ['month' => '2026-10']))->assertDownload('ventes-2026-10.xlsx');
    $this->actingAs($user)->get(route('reports.consumption.export'))->assertDownload('consommation-2026-10-23.xlsx');
    $this->actingAs($user)->get(route('reports.consumption.order'))->assertDownload('bon-de-commande-2026-10-23.xlsx');
});

test('cashiers cannot read the reports', function () {
    $cashier = User::factory()->role(Role::Cashier)->create();

    $this->actingAs($cashier)->get(route('reports.sales'))->assertForbidden();
    $this->actingAs($cashier)->get(route('reports.consumption'))->assertForbidden();
});
