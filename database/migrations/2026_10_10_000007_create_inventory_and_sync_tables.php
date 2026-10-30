<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Physical stock count: expected = system qty at started_at
        Schema::create('inventory_counts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('status', ['open', 'closed', 'cancelled'])->default('open');
            $table->dateTime('started_at');
            $table->dateTime('closed_at')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('inventory_count_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('inventory_count_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('batch_id')->constrained()->restrictOnDelete();
            $table->integer('expected_units');
            $table->integer('counted_units')->nullable();   // null = not counted yet
            $table->timestamps();

            $table->unique(['inventory_count_id', 'batch_id']);
        });

        // Idempotent ingest log: the tablet's event UUID is the primary key,
        // so a batch re-sent after a dropped connection is never applied twice.
        Schema::create('sync_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('device_id')->constrained()->cascadeOnDelete();
            $table->string('type', 50);                     // 'sale_created', ...
            $table->json('payload');
            $table->enum('status', ['applied', 'failed']);
            $table->text('error')->nullable();
            $table->dateTime('device_created_at');
            $table->timestamp('received_at')->useCurrent();

            $table->index(['device_id', 'received_at']);
        });

        // Shortfalls the server could not reallocate to another FEFO lot
        Schema::create('stock_discrepancies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('sale_item_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('medicine_id')->constrained()->restrictOnDelete();
            $table->foreignUuid('batch_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('qty_short_units');
            $table->enum('status', ['open', 'resolved'])->default('open')->index();
            $table->text('resolution')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('resolved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_discrepancies');
        Schema::dropIfExists('sync_events');
        Schema::dropIfExists('inventory_count_lines');
        Schema::dropIfExists('inventory_counts');
    }
};
