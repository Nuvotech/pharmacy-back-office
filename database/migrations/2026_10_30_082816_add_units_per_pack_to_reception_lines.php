<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Units in one box as delivered; validating the reception saves it on the medicine.
        // Null on lines saved before this column existed: the medicine's value is used.
        Schema::table('reception_lines', function (Blueprint $table) {
            $table->unsignedInteger('units_per_pack')->nullable()->after('packs');
        });
    }

    public function down(): void
    {
        Schema::table('reception_lines', function (Blueprint $table) {
            $table->dropColumn('units_per_pack');
        });
    }
};
