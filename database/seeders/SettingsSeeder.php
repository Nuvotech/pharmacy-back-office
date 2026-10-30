<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        foreach ([
            'base_currency' => 'CDF', // currency all prices are stored in (Congolese franc, shown "FC")
            'expiry_alert_days' => '90',  // "expiring soon" window
            'pharmacy_name' => '',
            'receipt_footer' => '',
        ] as $key => $value) {
            DB::table('settings')->updateOrInsert(
                ['key' => $key],
                ['value' => $value, 'updated_at' => $now]
            );
        }
    }
}
