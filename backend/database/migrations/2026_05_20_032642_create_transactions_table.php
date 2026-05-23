<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invoice_id')->nullable()->constrained()->nullOnDelete();
            $table->string('gateway'); // stripe | payu
            $table->string('gateway_id')->nullable()->index(); // Stripe PaymentIntent ID
            $table->string('status'); // pending | succeeded | failed | refunded
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('COP');
            $table->text('checkout_url')->nullable();
            $table->json('gateway_response')->nullable();
            $table->timestamps();

            $table->index(['order_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
