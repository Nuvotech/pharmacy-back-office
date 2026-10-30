<?php

// Sales are created offline on the counter tablet and pushed up on sync,
// so they keep the tablet's UUIDs.

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('receipt_no', 30)->unique();     // e.g. C1-20261010-0042
            $table->foreignUuid('device_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // cashier
            $table->decimal('total', 14, 2);                // base currency
            $table->enum('currency_paid', ['USD', 'CDF']);
            $table->decimal('exchange_rate', 14, 4);        // USD->CDF rate used
            $table->decimal('amount_paid', 14, 2);          // in currency_paid
            $table->decimal('change_given', 14, 2)->default(0);
            $table->enum('payment_method', ['cash', 'mobile_money'])->default('cash');
            $table->string('payment_ref', 100)->nullable(); // mobile money reference
            $table->enum('status', ['completed', 'partially_returned', 'returned'])->default('completed');
            $table->dateTime('sold_at')->index();           // device time
            $table->timestamp('synced_at')->nullable();     // server time of receipt
            $table->timestamps();

            $table->index(['user_id', 'sold_at']);
        });

        Schema::create('sale_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('sale_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('medicine_id')->constrained()->restrictOnDelete();
            $table->foreignUuid('batch_id')->constrained()->restrictOnDelete(); // FEFO lot used
            $table->enum('sell_mode', ['pack', 'unit']);
            $table->unsignedInteger('quantity');            // packs or units, per sell_mode
            $table->unsignedInteger('qty_units');           // converted to smallest unit
            $table->decimal('unit_price', 12, 2);           // per pack or unit, base currency
            $table->decimal('line_total', 14, 2);
            $table->unsignedInteger('qty_returned_units')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
    }
};
