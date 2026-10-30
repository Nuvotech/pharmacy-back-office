<?php

use App\Enums\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('it creates an administrator who can sign in to the back office', function () {
    $this->artisan('pharmacy:create-admin')
        ->expectsQuestion('Nom', 'Dr Kabombo')
        ->expectsQuestion('E-mail (connexion au back-office)', ' Kabombo@Pharmacie.cd ')
        ->expectsQuestion('Mot de passe', 'Un-Mot-De-Passe-2026!')
        ->expectsQuestion('Confirmez le mot de passe', 'Un-Mot-De-Passe-2026!')
        ->expectsConfirmation('Ajouter aussi une connexion à la tablette (identifiant + code PIN) ?', 'no')
        ->expectsOutputToContain('Administrateur créé')
        ->assertSuccessful();

    $admin = User::query()->sole();
    expect($admin->role)->toBe(Role::Admin)
        ->and($admin->email)->toBe('kabombo@pharmacie.cd')
        ->and($admin->is_active)->toBeTrue()
        ->and($admin->username)->toBeNull()
        ->and(Hash::check('Un-Mot-De-Passe-2026!', (string) $admin->password))->toBeTrue();

    $this->post(route('login.store'), ['email' => 'kabombo@pharmacie.cd', 'password' => 'Un-Mot-De-Passe-2026!'])
        ->assertRedirect(route('dashboard'));
});

test('it can add a tablet username and PIN', function () {
    $this->artisan('pharmacy:create-admin')
        ->expectsQuestion('Nom', 'Dr Kabombo')
        ->expectsQuestion('E-mail (connexion au back-office)', 'kabombo@pharmacie.cd')
        ->expectsQuestion('Mot de passe', 'Un-Mot-De-Passe-2026!')
        ->expectsQuestion('Confirmez le mot de passe', 'Un-Mot-De-Passe-2026!')
        ->expectsConfirmation('Ajouter aussi une connexion à la tablette (identifiant + code PIN) ?', 'yes')
        ->expectsQuestion('Identifiant tablette', 'Kabombo')
        ->expectsQuestion('Code PIN (4 à 8 chiffres)', '482913')
        ->assertSuccessful();

    $admin = User::query()->sole();
    expect($admin->username)->toBe('kabombo')
        ->and(Hash::check('482913', (string) $admin->pin_hash))->toBeTrue();
});
