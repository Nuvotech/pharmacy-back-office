<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // An uploaded opening-stock file, checked row by row. Nothing reaches stock until it is imported.
        Schema::create('stock_imports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('file_name');
            $table->string('status', 20)->default('checked');   // checked | importing | imported | failed
            $table->unsignedInteger('row_count');
            $table->json('valid_rows');                          // normalised rows ready to import
            $table->json('errors');                              // [{line, medicine, column, problem}]
            $table->foreignUuid('reception_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('imported_lots')->default(0);
            $table->unsignedInteger('created_medicines')->default(0);
            $table->dateTime('imported_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_imports');
    }
};
