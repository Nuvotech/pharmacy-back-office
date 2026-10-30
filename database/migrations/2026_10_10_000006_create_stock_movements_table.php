<?php

// Append-only history of every stock change. Never update or delete rows here;
// correct mistakes with a new movement.

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('batch_id')->constrained()->restrictOnDelete();
            $table->foreignUuid('medicine_id')->constrained()->restrictOnDelete();
            $table->enum('type', [
                'opening_stock',
                'reception',
                'sale',
                'customer_return',
                'supplier_return',
                'adjustment',
                'expiry_writeoff',
                'inventory_correction',
                'sync_reallocation',
            ]);
            $table->integer('qty_units');                   // + in, - out
            $table->string('reason')->nullable();           // required for adjustments
            $table->string('reference_type', 50)->nullable(); // 'sale', 'reception', 'inventory_count'
            $table->uuid('reference_id')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('device_id')->nullable()->constrained()->nullOnDelete();
            $table->dateTime('occurred_at');
            $table->timestamp('created_at')->nullable();

            $table->index(['batch_id', 'occurred_at']);
            $table->index(['medicine_id', 'occurred_at']);
            $table->index(['type', 'occurred_at']);
            $table->index(['reference_type', 'reference_id']);
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE stock_movements ADD CONSTRAINT chk_movement_not_zero CHECK (qty_units <> 0)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
