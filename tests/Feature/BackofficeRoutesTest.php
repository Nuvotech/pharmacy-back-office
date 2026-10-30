<?php

use App\Models\Medicine;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

dataset('back-office screens', [
    'stock import' => ['stock-import.create', 'stock-import/create'],
    'new reception' => ['receptions.create', 'receptions/create'],
    'inventory' => ['inventory.index', 'inventory/index'],
    'returns' => ['returns.index', 'returns/index'],
    'adjustments' => ['adjustments.index', 'adjustments/index'],
    'sales report' => ['reports.sales', 'reports/sales'],
    'consumption report' => ['reports.consumption', 'reports/consumption'],
]);

dataset('medicine screens', [
    'medicine list' => [fn () => route('medicines.index')],
    'new medicine' => [fn () => route('medicines.create')],
    'edit medicine' => [fn () => route('medicines.edit', Medicine::factory()->create())],
]);

test('guests are redirected to the login page', function (string $routeName) {
    $response = $this->get(route($routeName));

    $response->assertRedirect(route('login'));
})->with('back-office screens');

test('guests are redirected to the login page from the medicine screens', function (string $url) {
    $response = $this->get($url);

    $response->assertRedirect(route('login'));
})->with('medicine screens');

test('authenticated users see the screen', function (string $routeName, string $component) {
    $this->actingAs(User::factory()->create());

    $response = $this->get(route($routeName));

    $response->assertInertia(fn (Assert $page) => $page->component($component));
})->with('back-office screens');

test('authenticated users see the medicine list', function () {
    $this->actingAs(User::factory()->create());

    $response = $this->get(route('medicines.index'));

    $response->assertInertia(fn (Assert $page) => $page->component('medicines/index'));
});

test('the new medicine form opens without a medicine', function () {
    $this->actingAs(User::factory()->create());

    $response = $this->get(route('medicines.create'));

    $response->assertInertia(fn (Assert $page) => $page
        ->component('medicines/form')
        ->where('medicine', null)
    );
});

test('the edit form receives the medicine from the URL', function () {
    $this->actingAs(User::factory()->create());
    $medicine = Medicine::factory()->create();

    $response = $this->get(route('medicines.edit', $medicine));

    $response->assertInertia(fn (Assert $page) => $page
        ->component('medicines/form')
        ->where('medicine.id', $medicine->id)
    );
});
