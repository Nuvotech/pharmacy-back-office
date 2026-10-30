<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suppliers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->index();                // laboratory or wholesaler
            $table->string('phone', 50)->nullable();
            $table->string('address')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Quantities in the smallest unit; prices in the base currency.
        Schema::create('medicines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->index();                // brand / commercial name
            $table->string('dci')->nullable()->index();     // active ingredient (INN)
            $table->string('dosage', 100)->nullable();      // e.g. 500 mg
            $table->string('form', 100)->nullable();        // tablet, syrup, injection...
            $table->string('category', 100)->nullable();
            $table->string('barcode', 64)->nullable()->unique();
            $table->unsignedInteger('units_per_pack')->default(1);   // 1 = never split
            $table->decimal('sale_price_pack', 12, 2)->default(0);
            $table->decimal('sale_price_unit', 12, 2)->nullable();   // null = not sold by unit
            $table->unsignedInteger('min_stock_units')->default(0);
            $table->boolean('prescription_required')->default(false);
            $table->foreignUuid('default_supplier_id')->nullable()
                ->constrained('suppliers')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index('updated_at');                    // catalogue pull-down to the tablet
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE medicines ADD CONSTRAINT chk_units_per_pack CHECK (units_per_pack >= 1)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('medicines');
        Schema::dropIfExists('suppliers');
    }
};
