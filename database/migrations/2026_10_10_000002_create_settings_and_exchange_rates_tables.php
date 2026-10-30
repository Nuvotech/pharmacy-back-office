<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Key/value settings: base_currency, expiry_alert_days, pharmacy_name, receipt_footer
        Schema::create('settings', function (Blueprint $table) {
            $table->string('key', 100)->primary();
            $table->text('value')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        // One rate per day, entered by the pharmacist in the back office
        Schema::create('exchange_rates', function (Blueprint $table) {
            $table->id();
            $table->date('rate_date')->unique();
            $table->decimal('usd_to_cdf', 14, 4);           // 1 USD = x CDF
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exchange_rates');
        Schema::dropIfExists('settings');
    }
};
