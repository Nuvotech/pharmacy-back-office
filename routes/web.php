<?php

use App\Http\Controllers\BackOffice\DashboardController;
use App\Http\Controllers\BackOffice\InventoryController;
use App\Http\Controllers\BackOffice\MedicineController;
use App\Http\Controllers\BackOffice\ReceptionController;
use App\Http\Controllers\BackOffice\ReportController;
use App\Http\Controllers\BackOffice\StockImportController;
use App\Http\Controllers\BackOffice\UserController;
use App\Models\InventoryCount;
use App\Models\Medicine;
use App\Models\Reception;
use App\Models\StockImport;
use App\Models\User;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard')->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::get('medicines', [MedicineController::class, 'index'])->name('medicines.index');
    Route::get('medicines/create', [MedicineController::class, 'create'])->can('create', Medicine::class)->name('medicines.create');
    Route::post('medicines', [MedicineController::class, 'store'])->can('create', Medicine::class)->name('medicines.store');
    Route::get('medicines/{medicine}/edit', [MedicineController::class, 'edit'])->can('update', 'medicine')->name('medicines.edit');
    Route::patch('medicines/{medicine}', [MedicineController::class, 'update'])->can('update', 'medicine')->name('medicines.update');

    // UI only for now: the pages show sample data until the API exists.
    Route::get('stock-import', [StockImportController::class, 'create'])->can('create', StockImport::class)->name('stock-import.create');
    Route::post('stock-import', [StockImportController::class, 'store'])->can('create', StockImport::class)->name('stock-import.store');
    Route::get('stock-import/template', [StockImportController::class, 'template'])->can('create', StockImport::class)->name('stock-import.template');
    Route::get('stock-import/{stockImport}/errors', [StockImportController::class, 'errors'])->can('view', 'stockImport')->name('stock-import.errors');
    Route::post('stock-import/{stockImport}/run', [StockImportController::class, 'run'])->can('view', 'stockImport')->name('stock-import.run');
    Route::get('receptions/create', [ReceptionController::class, 'create'])->can('create', Reception::class)->name('receptions.create');
    Route::post('receptions/draft', [ReceptionController::class, 'saveDraft'])->can('create', Reception::class)->name('receptions.draft');
    Route::post('receptions/validate', [ReceptionController::class, 'validateReception'])->can('create', Reception::class)->name('receptions.validate');
    Route::get('inventory', [InventoryController::class, 'index'])->can('viewAny', InventoryCount::class)->name('inventory.index');
    Route::post('inventory', [InventoryController::class, 'store'])->can('create', InventoryCount::class)->name('inventory.store');
    Route::patch('inventory/lines/{line}', [InventoryController::class, 'updateLine'])->can('create', InventoryCount::class)->name('inventory.lines.update');
    Route::post('inventory/{count}/close', [InventoryController::class, 'close'])->can('update', 'count')->name('inventory.close');
    Route::get('inventory/{count}/print', [InventoryController::class, 'print'])->can('update', 'count')->name('inventory.print');
    Route::inertia('returns', 'returns/index')->name('returns.index');
    Route::inertia('adjustments', 'adjustments/index')->name('adjustments.index');
    Route::middleware('can:view-reports')->group(function () {
        Route::get('reports/sales', [ReportController::class, 'sales'])->name('reports.sales');
        Route::get('reports/sales/export', [ReportController::class, 'exportSales'])->name('reports.sales.export');
        Route::get('reports/consumption', [ReportController::class, 'consumption'])->name('reports.consumption');
        Route::get('reports/consumption/export', [ReportController::class, 'exportConsumption'])->name('reports.consumption.export');
        Route::get('reports/consumption/order', [ReportController::class, 'exportOrder'])->name('reports.consumption.order');
    });

    Route::get('users', [UserController::class, 'index'])->can('viewAny', User::class)->name('users.index');
    Route::get('users/create', [UserController::class, 'create'])->can('create', User::class)->name('users.create');
    Route::post('users', [UserController::class, 'store'])->can('create', User::class)->name('users.store');
    Route::get('users/{user}/edit', [UserController::class, 'edit'])->can('update', 'user')->name('users.edit');
    Route::patch('users/{user}', [UserController::class, 'update'])->can('update', 'user')->name('users.update');
});

require __DIR__.'/settings.php';
