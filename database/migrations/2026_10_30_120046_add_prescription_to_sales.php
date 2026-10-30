<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Captured at the counter when a line needs a prescription.
        Schema::table('sales', function (Blueprint $table) {
            $table->string('prescriber')->nullable()->after('payment_ref');
            $table->string('patient_name')->nullable()->after('prescriber');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['prescriber', 'patient_name']);
        });
    }
};
