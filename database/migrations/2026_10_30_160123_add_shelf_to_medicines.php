<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Where the medicine is kept in the pharmacy (e.g. "A2"); used to count stock shelf by shelf.
        Schema::table('medicines', function (Blueprint $table) {
            $table->string('shelf', 20)->nullable()->after('barcode');
        });
    }

    public function down(): void
    {
        Schema::table('medicines', function (Blueprint $table) {
            $table->dropColumn('shelf');
        });
    }
};
