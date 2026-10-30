<?php

use App\Enums\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

function admin(): User
{
    return User::factory()->role(Role::Admin)->create();
}

function cashierPayload(array $overrides = []): array
{
    return [
        'name' => 'Grâce M.',
        'role' => 'cashier',
        'username' => 'grace.m',
        'pin' => '1234',
        'email' => '',
        'password' => '',
        'is_active' => true,
        ...$overrides,
    ];
}

test('guests are redirected to the login page', function () {
    $this->get(route('users.index'))->assertRedirect(route('login'));
});

test('pharmacists and cashiers cannot manage users', function (Role $role) {
    $user = User::factory()->role($role)->create();

    $this->actingAs($user)->get(route('users.index'))->assertForbidden();
    $this->actingAs($user)->post(route('users.store'), cashierPayload())->assertForbidden();
    $this->actingAs($user)->patch(route('users.update', $user), cashierPayload())->assertForbidden();

    expect(User::where('username', 'grace.m')->exists())->toBeFalse();
})->with([Role::Pharmacist, Role::Cashier]);

test('admins see every account without its PIN or password', function () {
    $cashier = User::factory()->withPin()->role(Role::Cashier)->create(['name' => 'Aline', 'email' => null, 'password' => null]);
    $admin = User::factory()->role(Role::Admin)->create(['name' => 'Zoé']);

    $response = $this->actingAs($admin)->get(route('users.index'));

    $response->assertInertia(fn (Assert $page) => $page
        ->component('users/index')
        ->has('users.data', 2)
        ->where('users.data.0.id', $cashier->id)
        ->where('users.data.0.has_pin', true)
        ->where('users.data.1.has_pin', false)
        ->missing('users.data.0.pin_hash')
        ->missing('users.data.0.password')
    );
});

test('an admin creates a cashier who signs in on the tablet with username and PIN', function () {
    $response = $this->actingAs(admin())->post(route('users.store'), cashierPayload([
        'username' => '  Grace.M ',
        'email' => 'ignored@example.com',
        'password' => 'ignored-password',
    ]));

    $response->assertRedirect(route('users.index'))->assertInertiaFlash('toast.message', 'Utilisateur créé.');

    $cashier = User::where('username', 'grace.m')->sole();
    expect($cashier->role)->toBe(Role::Cashier)
        ->and($cashier->is_active)->toBeTrue()
        ->and(Hash::check('1234', $cashier->pin_hash))->toBeTrue()
        ->and(password_get_info($cashier->pin_hash)['options']['cost'])->toBe(User::PIN_HASH_ROUNDS)
        ->and($cashier->email)->toBeNull()
        ->and($cashier->password)->toBeNull();

    $this->postJson(route('api.v1.auth.login'), ['username' => 'grace.m', 'pin' => '1234', 'device_name' => 'Caisse 1'])
        ->assertCreated();
});

test('an admin creates a pharmacist with a back-office login', function () {
    $this->actingAs(admin())->post(route('users.store'), [
        'name' => 'Dr Kabila',
        'role' => 'pharmacist',
        'username' => '',
        'pin' => '',
        'email' => 'kabila@example.com',
        'password' => 'secret-password',
        'is_active' => true,
    ])->assertRedirect(route('users.index'));

    $pharmacist = User::where('email', 'kabila@example.com')->sole();
    expect($pharmacist->role)->toBe(Role::Pharmacist)
        ->and($pharmacist->username)->toBeNull()
        ->and($pharmacist->pin_hash)->toBeNull()
        ->and(Hash::check('secret-password', $pharmacist->password))->toBeTrue();
});

test('creating an account shows French messages for missing and invalid fields', function (array $payload, string $field, string $message) {
    User::factory()->withPin()->create(['username' => 'pris', 'email' => 'pris@example.com']);

    $response = $this->actingAs(admin())->post(route('users.store'), $payload);

    $response->assertSessionHasErrors([$field => $message]);
})->with([
    'no name' => [cashierPayload(['name' => '']), 'name', 'Saisissez le nom.'],
    'unknown role' => [cashierPayload(['role' => 'owner']), 'role', 'Choisissez un rôle.'],
    'cashier without username' => [cashierPayload(['username' => '']), 'username', 'Un caissier doit avoir un identifiant pour se connecter à la tablette.'],
    'username with spaces' => [cashierPayload(['username' => 'grace m']), 'username', "L'identifiant doit contenir de 3 à 50 caractères : lettres minuscules, chiffres, point, tiret ou tiret bas."],
    'username taken' => [cashierPayload(['username' => 'Pris']), 'username', 'Cet identifiant est déjà utilisé.'],
    'username without PIN' => [cashierPayload(['pin' => '']), 'pin', 'Saisissez un code PIN pour la connexion à la tablette.'],
    'PIN too short' => [cashierPayload(['pin' => '123']), 'pin', 'Le code PIN doit contenir de 4 à 8 chiffres.'],
    'pharmacist without email' => [cashierPayload(['role' => 'pharmacist', 'password' => 'secret-password']), 'email', "L'e-mail est requis pour se connecter au back-office."],
    'email taken' => [cashierPayload(['role' => 'pharmacist', 'email' => 'pris@example.com', 'password' => 'secret-password']), 'email', 'Cet e-mail est déjà utilisé.'],
    'pharmacist without password' => [cashierPayload(['role' => 'pharmacist', 'email' => 'new@example.com']), 'password', 'Saisissez un mot de passe pour le back-office.'],
    'short password' => [cashierPayload(['role' => 'pharmacist', 'email' => 'new@example.com', 'password' => 'short']), 'password', 'Le mot de passe doit contenir au moins 8 caractères.'],
]);

test('editing with blank PIN and password keeps them', function () {
    $pharmacist = User::factory()->withPin('4321')->create();
    $passwordHash = $pharmacist->password;
    $pinHash = $pharmacist->pin_hash;

    $this->actingAs(admin())->patch(route('users.update', $pharmacist), [
        'name' => 'Nouveau nom',
        'role' => 'pharmacist',
        'username' => $pharmacist->username,
        'pin' => '',
        'email' => $pharmacist->email,
        'password' => '',
        'is_active' => true,
    ])->assertRedirect(route('users.index'));

    $pharmacist->refresh();
    expect($pharmacist->name)->toBe('Nouveau nom')
        ->and($pharmacist->password)->toBe($passwordHash)
        ->and($pharmacist->pin_hash)->toBe($pinHash);
});

test('changing the PIN or deactivating an account signs it out of every tablet', function (array $changes) {
    $cashier = User::factory()->withPin('1234')->role(Role::Cashier)->create(['email' => null]);
    $cashier->createToken('Caisse 1', ['counter']);

    $this->actingAs(admin())->patch(
        route('users.update', $cashier),
        cashierPayload(['username' => $cashier->username, 'pin' => '', ...$changes]),
    )->assertRedirect(route('users.index'));

    expect($cashier->tokens()->count())->toBe(0);
})->with([
    'new PIN' => [['pin' => '9876']],
    'deactivated' => [['is_active' => false]],
]);

test('editing only the name keeps the account signed in', function () {
    $cashier = User::factory()->withPin('1234')->role(Role::Cashier)->create(['email' => null, 'password' => null]);
    $cashier->createToken('Caisse 1', ['counter']);

    $this->actingAs(admin())->patch(
        route('users.update', $cashier),
        cashierPayload(['name' => 'Grâce Mbuyi', 'username' => $cashier->username, 'pin' => '']),
    );

    expect($cashier->tokens()->count())->toBe(1);
});

test('an admin cannot deactivate their own account or remove their own admin role', function () {
    $admin = admin();
    $payload = [
        'name' => $admin->name,
        'role' => 'admin',
        'username' => '',
        'pin' => '',
        'email' => $admin->email,
        'password' => '',
        'is_active' => true,
    ];

    $this->actingAs($admin)->patch(route('users.update', $admin), [...$payload, 'is_active' => false])
        ->assertSessionHasErrors(['is_active' => 'Vous ne pouvez pas désactiver votre propre compte.']);
    $this->actingAs($admin)->patch(route('users.update', $admin), [...$payload, 'role' => 'pharmacist'])
        ->assertSessionHasErrors(['role' => 'Vous ne pouvez pas retirer votre propre rôle administrateur.']);

    expect($admin->fresh())->is_active->toBeTrue()->role->toBe(Role::Admin);
});
