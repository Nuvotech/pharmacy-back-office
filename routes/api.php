<?php

use App\Http\Controllers\Api\V1\AccountController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\SyncController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('api.v1.')->group(function () {
    Route::post('auth/login', [AuthController::class, 'login'])
        ->middleware('throttle:api-login')
        ->name('auth.login');

    Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
        Route::get('auth/me', [AuthController::class, 'me'])->name('auth.me');
        Route::post('auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
        Route::get('accounts', [AccountController::class, 'index'])->middleware('abilities:counter')->name('accounts.index');
        Route::get('sync/catalogue', [SyncController::class, 'catalogue'])->middleware('abilities:counter')->name('sync.catalogue');
        Route::get('sync/stock', [SyncController::class, 'stock'])->middleware('abilities:counter')->name('sync.stock');
        Route::post('sync/push', [SyncController::class, 'push'])->middleware('abilities:counter')->name('sync.push');
    });
});
