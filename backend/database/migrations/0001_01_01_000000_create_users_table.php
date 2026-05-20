<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('nit', 20)->unique();
            $table->string('address')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('contact_name')->nullable();
            $table->boolean('is_distributor')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('google2fa_secret')->nullable();
            $table->boolean('two_factor_enabled')->default(false);
            $table->boolean('is_active')->default(true);
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('credit_limits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->decimal('limit_amount', 12, 2)->default(0);
            $table->decimal('used_amount', 12, 2)->default(0);
            $table->date('due_date')->nullable();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('credit_limits');
        Schema::dropIfExists('users');
        Schema::dropIfExists('companies');
    }
};
