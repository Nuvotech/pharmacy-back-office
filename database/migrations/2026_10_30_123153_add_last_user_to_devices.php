<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Who was signed in on the device at its last sync (shown on the dashboard).
        Schema::table('devices', function (Blueprint $table) {
            $table->foreignId('last_user_id')->nullable()->after('last_clock_skew_s')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('devices', function (Blueprint $table) {
            $table->dropConstrainedForeignId('last_user_id');
        });
    }
};
