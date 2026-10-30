<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domain\Users\SaveUser;
use App\Enums\Role;
use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

/**
 * Creates an administrator on a fresh server (the back office has no public registration). The password
 * and PIN are always typed at the prompt, never passed as options, so they don't end up in the shell
 * history. The password follows the app's password rules (12+ characters with mixed case, numbers and
 * symbols in production).
 */
#[Signature('pharmacy:create-admin')]
#[Description('Créer un compte administrateur (back-office, et tablette en option)')]
class CreateAdmin extends Command
{
    public function handle(SaveUser $saveUser): int
    {
        $name = text(
            label: 'Nom',
            required: true,
            validate: fn (string $value): ?string => $this->errorFor(['name' => $value], ['name' => ['required', 'string', 'max:255']]),
        );

        $email = text(
            label: 'E-mail (connexion au back-office)',
            required: true,
            validate: fn (string $value): ?string => $this->errorFor(
                ['email' => mb_strtolower(trim($value))],
                ['email' => ['required', 'email', 'max:255', Rule::unique(User::class)]],
            ),
        );

        $password = password(
            label: 'Mot de passe',
            required: true,
            hint: app()->isProduction()
                ? '12 caractères au moins, avec majuscules, minuscules, chiffres et symboles.'
                : '8 caractères au moins.',
            validate: fn (string $value): ?string => $this->errorFor(
                ['password' => $value],
                ['password' => ['required', 'string', 'min:8', Password::defaults()]],
            ),
        );

        password(
            label: 'Confirmez le mot de passe',
            required: true,
            validate: fn (string $value): ?string => $value === $password ? null : 'Les mots de passe ne correspondent pas.',
        );

        $username = null;
        $pin = null;
        if (confirm(label: 'Ajouter aussi une connexion à la tablette (identifiant + code PIN) ?', default: false)) {
            $username = mb_strtolower(trim(text(
                label: 'Identifiant tablette',
                placeholder: 'ex. j.mbuyi',
                required: true,
                validate: fn (string $value): ?string => $this->errorFor(
                    ['username' => mb_strtolower(trim($value))],
                    ['username' => ['required', 'regex:/^[a-z0-9._-]{3,50}$/', Rule::unique(User::class)]],
                ),
            )));

            $pin = password(
                label: 'Code PIN (4 à 8 chiffres)',
                required: true,
                validate: fn (string $value): ?string => preg_match('/^\d{4,8}$/', $value) === 1
                    ? null
                    : 'Le code PIN doit contenir de 4 à 8 chiffres.',
            );
        }

        $user = $saveUser->handle(null, [
            'name' => trim($name),
            'role' => Role::Admin->value,
            'username' => $username,
            'email' => mb_strtolower(trim($email)),
            'pin' => $pin,
            'password' => $password,
            'is_active' => true,
        ]);

        $this->components->info("Administrateur créé : {$user->name} ({$user->email}).");

        return self::SUCCESS;
    }

    /**
     * The first French validation message for the value, or null when it is valid.
     *
     * @param  array<string, mixed>  $data
     * @param  array<string, mixed>  $rules
     */
    private function errorFor(array $data, array $rules): ?string
    {
        $validator = Validator::make($data, $rules, [
            'required' => 'Ce champ est obligatoire.',
            'email' => 'Saisissez une adresse e-mail valide.',
            'email.unique' => 'Cet e-mail est déjà utilisé.',
            'username.unique' => 'Cet identifiant est déjà utilisé.',
            'username.regex' => "L'identifiant doit contenir de 3 à 50 caractères : lettres minuscules, chiffres, point, tiret ou tiret bas.",
            'min' => 'Le mot de passe doit contenir au moins :min caractères.',
        ]);

        return $validator->fails() ? $validator->errors()->first() : null;
    }
}
