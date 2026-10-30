<?php

use App\Enums\MovementType;
use App\Enums\Role;
use App\Models\Batch;
use App\Models\Medicine;
use App\Models\Reception;
use App\Models\StockImport;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Inertia\Testing\AssertableInertia as Assert;

function stockCsv(array $lines): UploadedFile
{
    $header = 'nom,dci,numero_lot,date_expiration,quantite,unites_par_boite,prix_boite,prix_unite,prix_achat_boite';

    return UploadedFile::fake()->createWithContent('stock-initial.csv', implode("\n", [$header, ...$lines])."\n");
}

function stockManager(): User
{
    return User::factory()->role(Role::Pharmacist)->create();
}

beforeEach(function () {
    $this->travelTo('2026-10-30 09:12:00');
});

test('an uploaded file is checked, nothing is saved, and the errors are shown', function () {
    $user = stockManager();

    $this->actingAs($user)
        ->post(route('stock-import.store'), ['file' => stockCsv([
            'PARACETAMOL 500 MG,Paracétamol,PC-8810,11/2027,34,10,1000,120,700',
            'QUININE 300 MG,,QN-1,03/2028,5,0,2500,,',
        ])])
        ->assertRedirect(route('stock-import.create'))
        ->assertSessionHasNoErrors();

    expect(Batch::query()->count())->toBe(0);

    $this->actingAs($user)->get(route('stock-import.create'))->assertInertia(fn (Assert $page) => $page
        ->component('stock-import/create')
        ->where('stockImport.file_name', 'stock-initial.csv')
        ->where('stockImport.row_count', 2)
        ->where('stockImport.valid_count', 1)
        ->where('stockImport.error_row_count', 1)
        ->where('stockImport.errors.0.line', 3)
        ->where('stockImport.errors.0.column', 'unites_par_boite')
        ->where('completed', null)
    );
});

test('a file without the template columns is refused', function () {
    $file = UploadedFile::fake()->createWithContent('autre.csv', "produit,stock\nX,3\n");

    $this->actingAs(stockManager())
        ->post(route('stock-import.store'), ['file' => $file])
        ->assertSessionHasErrors('file');

    expect(StockImport::query()->count())->toBe(0);
});

test('a file that is not Excel or CSV is refused', function () {
    $this->actingAs(stockManager())
        ->post(route('stock-import.store'), ['file' => UploadedFile::fake()->create('stock.pdf', 10, 'application/pdf')])
        ->assertSessionHasErrors(['file' => __('stock_import.file_type', locale: 'fr')]);
});

test('importing creates the lots as opening stock, new medicines, and updates existing ones', function () {
    $user = stockManager();
    $existing = Medicine::factory()->create(['name' => 'PARACETAMOL 500 MG', 'units_per_pack' => 1, 'sale_price_pack' => '0']);
    $this->actingAs($user)->post(route('stock-import.store'), ['file' => stockCsv([
        'paracetamol 500 mg,Paracétamol,PC-8810,11/2027,34,10,1000,120,700',
        'MUTOMBO 50G,,,05/2029,12,50,5000,,4000',
        'BAD,,X,,1,1,1,,',
    ])]);
    $stockImport = StockImport::query()->sole();

    $this->actingAs($user)
        ->post(route('stock-import.run', $stockImport))
        ->assertRedirect(route('stock-import.create', ['done' => $stockImport->id]));

    $existing->refresh();
    $mutombo = Medicine::query()->where('name', 'MUTOMBO 50G')->sole();
    expect($existing->units_per_pack)->toBe(10)
        ->and($existing->sale_price_pack)->toBe('1000.00')
        ->and($existing->sale_price_unit)->toBe('120.00')
        ->and($mutombo->units_per_pack)->toBe(50)
        ->and($existing->batches()->sole()->only(['lot_number', 'qty_on_hand', 'purchase_price_unit']))
        ->toBe(['lot_number' => 'PC-8810', 'qty_on_hand' => 340, 'purchase_price_unit' => '70.0000'])
        ->and($mutombo->batches()->sole()->lot_number)->toBe('INIT-20261030-3')
        ->and($mutombo->batches()->sole()->qty_on_hand)->toBe(600)
        ->and(StockMovement::query()->where('type', MovementType::OpeningStock)->sum('qty_units'))->toBe(940)
        ->and(Reception::query()->sole()->is_opening_stock)->toBeTrue()
        ->and($stockImport->fresh()->only(['status', 'imported_lots', 'created_medicines']))
        ->toBe(['status' => 'imported', 'imported_lots' => 2, 'created_medicines' => 1]);

    $this->actingAs($user)
        ->get(route('stock-import.create', ['done' => $stockImport->id]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('stockImport', null)
            ->where('completed.imported_lots', 2)
            ->where('completed.created_medicines', 1)
        );
});

test('a file is imported once', function () {
    $user = stockManager();
    $this->actingAs($user)->post(route('stock-import.store'), ['file' => stockCsv(['A,,L1,11/2027,1,10,100,,'])]);
    $stockImport = StockImport::query()->sole();

    $this->actingAs($user)->post(route('stock-import.run', $stockImport));
    $this->actingAs($user)->post(route('stock-import.run', $stockImport))->assertSessionHasErrors('import');

    expect(Batch::query()->count())->toBe(1);
});

test('the template and the error list download as Excel files', function () {
    $user = stockManager();
    $this->actingAs($user)->post(route('stock-import.store'), ['file' => stockCsv(['BAD,,X,,1,1,1,,'])]);

    $this->actingAs($user)->get(route('stock-import.template'))->assertDownload('modele-stock-initial.xlsx');
    $this->actingAs($user)
        ->get(route('stock-import.errors', StockImport::query()->sole()))
        ->assertDownload('erreurs-import-stock.xlsx');
});

test('cashiers cannot import stock', function () {
    $this->actingAs(User::factory()->role(Role::Cashier)->create())
        ->get(route('stock-import.create'))
        ->assertForbidden();
});
