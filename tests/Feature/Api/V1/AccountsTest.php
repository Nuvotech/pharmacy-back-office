<?php

use App\Enums\Role;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

test('a counter token downloads the active accounts that can sign in offline', function () {
    $cashier = User::factory()->withPin('1234')->role(Role::Cashier)->create(['name' => 'Grâce M.']);
    User::factory()->withPin('1234')->inactive()->create();
    User::factory()->create(['username' => null, 'pin_hash' => null]);
    Sanctum::actingAs($cashier, ['counter']);

    $response = $this->getJson(route('api.v1.accounts.index'));

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $cashier->id)
        ->assertJsonPath('data.0.username', $cashier->username)
        ->assertJsonPath('data.0.role', 'cashier')
        ->assertJsonPath('data.0.pin_hash', $cashier->pin_hash)
        ->assertJsonMissingPath('data.0.password');
});

test('a token without the counter ability is refused', function () {
    Sanctum::actingAs(User::factory()->create(), ['back-office']);

    $this->getJson(route('api.v1.accounts.index'))
        ->assertForbidden()
        ->assertJsonPath('code', 'FORBIDDEN');
});

test('the account list needs a token', function () {
    $this->getJson(route('api.v1.accounts.index'))->assertUnauthorized();
});
