<?php

use App\Domain\Auth\IssueApiToken;
use App\Enums\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

function loginPayload(User $user, array $overrides = []): array
{
    return [
        'username' => $user->username,
        'pin' => '1234',
        'device_name' => 'Caisse 1',
        ...$overrides,
    ];
}

test('a cashier signs in with username and PIN and gets a counter token', function () {
    $this->freezeTime();
    $cashier = User::factory()->withPin('1234')->role(Role::Cashier)->create(['username' => 'grace.m']);

    $response = $this->postJson(route('api.v1.auth.login'), loginPayload($cashier, ['username' => '  Grace.M ']));

    $response->assertCreated()
        ->assertJsonPath('data.id', $cashier->id)
        ->assertJsonPath('data.username', 'grace.m')
        ->assertJsonPath('data.role', 'cashier')
        ->assertJsonPath('meta.token_type', 'Bearer')
        ->assertJsonPath('meta.abilities', ['counter'])
        ->assertJsonPath('meta.expires_at', now()->addHours(IssueApiToken::TOKEN_LIFETIME_HOURS)->utc()->toIso8601ZuluString())
        ->assertJsonMissingPath('data.pin_hash');

    $token = PersonalAccessToken::findToken($response->json('meta.token'));
    expect($token->tokenable->is($cashier))->toBeTrue()
        ->and($token->name)->toBe('Caisse 1')
        ->and($token->abilities)->toBe(['counter']);
});

test('a PIN hashed with the old cost is re-hashed at cost 8 when the user signs in', function () {
    $cashier = User::factory()->role(Role::Cashier)->create([
        'username' => 'grace.m',
        'pin_hash' => Hash::make('1234', ['rounds' => 12]),
    ]);

    $this->postJson(route('api.v1.auth.login'), loginPayload($cashier))->assertCreated();

    $pinHash = $cashier->fresh()->pin_hash;
    expect(password_get_info($pinHash)['options']['cost'])->toBe(User::PIN_HASH_ROUNDS)
        ->and(Hash::check('1234', $pinHash))->toBeTrue();
});

test('admins and pharmacists get a token for the counter and the back office', function (Role $role) {
    $user = User::factory()->withPin('1234')->role($role)->create();

    $response = $this->postJson(route('api.v1.auth.login'), loginPayload($user));

    $response->assertCreated()->assertJsonPath('meta.abilities', ['counter', 'back-office']);
})->with([Role::Admin, Role::Pharmacist]);

test('signing in again on the same device replaces the previous token', function () {
    $user = User::factory()->withPin('1234')->create();
    $first = $this->postJson(route('api.v1.auth.login'), loginPayload($user))->json('meta.token');

    $this->postJson(route('api.v1.auth.login'), loginPayload($user))->assertCreated();

    expect(PersonalAccessToken::findToken($first))->toBeNull()
        ->and($user->tokens()->count())->toBe(1);
});

test('sign-in is refused with the same answer for a wrong PIN, an unknown username or an inactive account', function (Closure $payload) {
    $response = $this->postJson(route('api.v1.auth.login'), $payload());

    $response->assertUnprocessable()->assertExactJson([
        'message' => 'Identifiant ou code PIN incorrect.',
        'code' => 'INVALID_CREDENTIALS',
        'errors' => [],
    ]);
    expect(PersonalAccessToken::count())->toBe(0);
})->with([
    'wrong PIN' => [fn () => loginPayload(User::factory()->withPin('1234')->create(), ['pin' => '9999'])],
    'unknown username' => [fn () => loginPayload(User::factory()->withPin('1234')->make(), ['username' => 'inconnu'])],
    'inactive account' => [fn () => loginPayload(User::factory()->withPin('1234')->inactive()->create())],
    'account without a PIN' => [fn () => ['username' => User::factory()->create(['username' => 'sans.pin'])->username, 'pin' => '1234', 'device_name' => 'Caisse 1']],
]);

test('sign-in requires a username, a PIN and a device name', function () {
    $response = $this->postJson(route('api.v1.auth.login'), []);

    $response->assertUnprocessable()
        ->assertJsonPath('code', 'VALIDATION_FAILED')
        ->assertJsonPath('message', 'Les informations saisies sont invalides.')
        ->assertJsonPath('errors.username.0', 'Saisissez votre identifiant.')
        ->assertJsonPath('errors.pin.0', 'Saisissez votre code PIN.')
        ->assertJsonPath('errors.device_name.0', "Le nom de l'appareil est requis.");
});

test('the PIN must be 4 to 8 digits', function (string $pin) {
    $user = User::factory()->withPin('1234')->create();

    $response = $this->postJson(route('api.v1.auth.login'), loginPayload($user, ['pin' => $pin]));

    $response->assertUnprocessable()->assertJsonPath('errors.pin.0', 'Le code PIN doit contenir de 4 à 8 chiffres.');
})->with(['123', '123456789', '12a4']);

test('the sixth sign-in attempt in a minute is rate limited', function () {
    $user = User::factory()->withPin('1234')->create();

    foreach (range(1, 5) as $attempt) {
        $this->postJson(route('api.v1.auth.login'), loginPayload($user, ['pin' => '9999']))->assertUnprocessable();
    }

    $response = $this->postJson(route('api.v1.auth.login'), loginPayload($user));

    $response->assertTooManyRequests()
        ->assertHeader('Retry-After')
        ->assertJsonPath('code', 'TOO_MANY_REQUESTS');
});

test('the token identifies the signed-in user', function () {
    $user = User::factory()->withPin('1234')->role(Role::Admin)->create();
    $token = $this->postJson(route('api.v1.auth.login'), loginPayload($user))->json('meta.token');

    $response = $this->withToken($token)->getJson(route('api.v1.auth.me'));

    $response->assertOk()
        ->assertJsonPath('data.id', $user->id)
        ->assertJsonPath('data.role', 'admin');
});

test('requests without a valid token are refused', function (?string $token) {
    $request = $token === null ? $this : $this->withToken($token);

    $response = $request->getJson(route('api.v1.auth.me'));

    $response->assertUnauthorized()->assertExactJson([
        'message' => 'Session expirée. Reconnectez-vous.',
        'code' => 'UNAUTHENTICATED',
        'errors' => [],
    ]);
})->with(['no token' => [null], 'unknown token' => ['1|not-a-real-token']]);

test('an expired token is refused', function () {
    $user = User::factory()->withPin('1234')->create();
    $token = $this->postJson(route('api.v1.auth.login'), loginPayload($user))->json('meta.token');

    $this->travel(IssueApiToken::TOKEN_LIFETIME_HOURS)->hours();
    $this->travel(1)->minute();

    $this->withToken($token)->getJson(route('api.v1.auth.me'))->assertUnauthorized();
});

test('signing out revokes only the token used', function () {
    $user = User::factory()->withPin('1234')->create();
    $counterToken = $this->postJson(route('api.v1.auth.login'), loginPayload($user))->json('meta.token');
    $officeToken = $this->postJson(route('api.v1.auth.login'), loginPayload($user, ['device_name' => 'Bureau']))->json('meta.token');

    $this->withToken($counterToken)->postJson(route('api.v1.auth.logout'))->assertNoContent();

    expect(PersonalAccessToken::findToken($counterToken))->toBeNull()
        ->and(PersonalAccessToken::findToken($officeToken))->not->toBeNull();
});
