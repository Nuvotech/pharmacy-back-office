<?php

use App\Http\Controllers\BackOffice\MedicineController;
use App\Http\Controllers\BackOffice\UserController;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::redirect('/', '/dashboard')->name('home');

Route::middleware(['auth'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    // UI only for now: the pages show sample data until the API exists.
    Route::get('medicines', [MedicineController::class, 'index'])->name('medicines.index');
    Route::inertia('medicines/create', 'medicines/form')->name('medicines.create');
    Route::get('medicines/{medicine}/edit', fn (string $medicine) => Inertia::render('medicines/form', [
        'medicineId' => $medicine,
    ]))->name('medicines.edit');
    Route::inertia('stock-import', 'stock-import/create')->name('stock-import.create');
    Route::inertia('receptions/create', 'receptions/create')->name('receptions.create');
    Route::inertia('inventory', 'inventory/index')->name('inventory.index');
    Route::inertia('returns', 'returns/index')->name('returns.index');
    Route::inertia('adjustments', 'adjustments/index')->name('adjustments.index');
    Route::inertia('reports/sales', 'reports/sales')->name('reports.sales');
    Route::inertia('reports/consumption', 'reports/consumption')->name('reports.consumption');

    Route::get('users', [UserController::class, 'index'])->can('viewAny', User::class)->name('users.index');
    Route::get('users/create', [UserController::class, 'create'])->can('create', User::class)->name('users.create');
    Route::post('users', [UserController::class, 'store'])->can('create', User::class)->name('users.store');
    Route::get('users/{user}/edit', [UserController::class, 'edit'])->can('update', 'user')->name('users.edit');
    Route::patch('users/{user}', [UserController::class, 'update'])->can('update', 'user')->name('users.update');
});

require __DIR__.'/settings.php';
