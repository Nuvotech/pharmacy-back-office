<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A reception is saved as a draft until it is validated; only validation creates lots.
        Schema::table('receptions', function (Blueprint $table) {
            $table->string('status', 20)->default('validated')->after('id');   // draft | validated
            $table->string('currency', 3)->default('CDF')->after('invoice_ref'); // invoice currency: USD | CDF
            $table->decimal('exchange_rate', 14, 4)->nullable()->after('currency'); // 1 USD = x CDF, USD invoices
            $table->dateTime('validated_at')->nullable()->after('received_at');

            $table->index(['status', 'user_id']);
        });

        // The delivery lines as typed from the invoice; on validation each one becomes a lot.
        Schema::create('reception_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('reception_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('medicine_id')->constrained()->restrictOnDelete();
            $table->string('lot_number', 100);
            $table->date('expiry_date');                    // last day of the expiry month
            $table->unsignedInteger('packs');               // boxes delivered
            $table->decimal('cost_per_pack', 14, 4);        // invoice currency
            $table->unsignedSmallInteger('position');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reception_lines');

        Schema::table('receptions', function (Blueprint $table) {
            $table->dropIndex(['status', 'user_id']);
            $table->dropColumn(['status', 'currency', 'exchange_rate', 'validated_at']);
        });
    }
};
