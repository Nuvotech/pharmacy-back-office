<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A delivery from a supplier (or the opening-stock import)
        Schema::create('receptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->string('invoice_ref', 100)->nullable();
            $table->dateTime('received_at')->index();
            $table->decimal('total_cost', 14, 2)->default(0);
            $table->boolean('is_opening_stock')->default(false);
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // One row per lot received. qty_on_hand is a cache of stock_movements.
        Schema::create('batches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('medicine_id')->constrained()->restrictOnDelete();
            $table->foreignUuid('reception_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->string('lot_number', 100);              // placeholder generated if unknown
            $table->date('expiry_date')->index();
            $table->decimal('purchase_price_unit', 12, 4)->default(0);
            $table->unsignedInteger('qty_received');        // units
            $table->integer('qty_on_hand');                 // units
            $table->dateTime('received_at');
            $table->timestamps();

            $table->index(['medicine_id', 'expiry_date'], 'batches_fefo_index');
            $table->index('updated_at');                    // stock pull-down to the tablet
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batches');
        Schema::dropIfExists('receptions');
    }
};
