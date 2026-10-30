<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Categories become their own table (a medicine can be in several, e.g. a children's syrup is also
// "Douleur"), replacing the free-text medicines.category column. Medicines get a photo path.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 100)->unique();              // e.g. "paludisme"
            $table->string('name', 100);                        // shown in the UI, e.g. "Paludisme"
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('category_medicine', function (Blueprint $table) {
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('medicine_id')->constrained()->cascadeOnDelete();
            $table->primary(['category_id', 'medicine_id']);
            $table->index('medicine_id');
        });

        Schema::table('medicines', function (Blueprint $table) {
            $table->string('image_path')->nullable()->after('barcode');   // on the public disk, WebP ≤ 400 px
            $table->dropColumn('category');
        });
    }

    public function down(): void
    {
        Schema::table('medicines', function (Blueprint $table) {
            $table->string('category', 100)->nullable()->after('form');
            $table->dropColumn('image_path');
        });

        Schema::dropIfExists('category_medicine');
        Schema::dropIfExists('categories');
    }
};
