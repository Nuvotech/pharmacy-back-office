<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\ExchangeRate;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([SettingsSeeder::class, MedicineSeeder::class, SupplierSeeder::class]);

        // Local testing only: a USD invoice needs a rate, and there is no screen to enter it yet.
        ExchangeRate::query()->firstOrCreate(['rate_date' => today()->toDateString()], ['usd_to_cdf' => '2800']);

        User::factory()->role(Role::Admin)->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        // Cashiers sign in on the tablet only (username + PIN); they have no back-office login.
        User::factory()->withPin('1234')->role(Role::Cashier)->create([
            'name' => 'Grâce M.',
            'username' => 'grace.m',
            'email' => null,
            'password' => null,
        ]);

        User::factory()->withPin('2468')->role(Role::Cashier)->create([
            'name' => 'Patrick K.',
            'username' => 'patrick.k',
            'email' => null,
            'password' => null,
        ]);

        // Admin on the tablet (j.mbuyi / 5678) and in the back office (mbuyi@example.com / password).
        User::factory()->withPin('5678')->role(Role::Admin)->create([
            'name' => 'J. Mbuyi',
            'username' => 'j.mbuyi',
            'email' => 'mbuyi@example.com',
        ]);
    }
}
