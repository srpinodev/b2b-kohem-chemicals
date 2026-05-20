<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $table->string('invoice_number', 30)->unique();
            $table->string('type')->default('invoice'); // invoice | proforma | credit_note
            $table->string('status')->default('draft'); // draft | issued | paid | cancelled
            $table->decimal('subtotal', 12, 2);
            $table->decimal('tax_rate', 5, 4)->default(0.1900); // 19% IVA Colombia
            $table->decimal('tax_amount', 12, 2);
            $table->decimal('total', 12, 2);
            $table->string('pdf_path')->nullable();
            $table->date('issued_at')->nullable();
            $table->date('due_date')->nullable();
            $table->timestamps();

            $table->index(['order_id', 'type']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
