<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // products: category filter + search by name/CAS + active products listing
        Schema::table('products', function (Blueprint $table) {
            $table->index(['category_id', 'is_active'], 'idx_products_category_active');
            $table->index(['is_active', 'name'], 'idx_products_active_name');
        });

        // orders: listing by company/user + status filtering
        Schema::table('orders', function (Blueprint $table) {
            $table->index(['company_id', 'status', 'created_at'], 'idx_orders_company_status');
            $table->index(['user_id', 'created_at'], 'idx_orders_user_created');
        });

        // order_state_logs: traceability queries per order
        Schema::table('order_state_logs', function (Blueprint $table) {
            $table->index(['order_id', 'transitioned_at'], 'idx_logs_order_time');
        });

        // invoices: by company for listing + by order for lookup
        Schema::table('invoices', function (Blueprint $table) {
            $table->index(['company_id', 'status', 'created_at'], 'idx_invoices_company_status');
            $table->index(['order_id', 'status'], 'idx_invoices_order_status');
        });

        // transactions: webhook lookup by gateway_id
        Schema::table('transactions', function (Blueprint $table) {
            $table->index('gateway_id', 'idx_transactions_gateway_id');
        });

        // notifications: unread count query per user
        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['notifiable_id', 'notifiable_type', 'read_at'], 'idx_notifications_notifiable_read');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('idx_products_category_active');
            $table->dropIndex('idx_products_active_name');
        });
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('idx_orders_company_status');
            $table->dropIndex('idx_orders_user_created');
        });
        Schema::table('order_state_logs', function (Blueprint $table) {
            $table->dropIndex('idx_logs_order_time');
        });
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex('idx_invoices_company_status');
            $table->dropIndex('idx_invoices_order_status');
        });
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('idx_transactions_gateway_id');
        });
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('idx_notifications_notifiable_read');
        });
    }
};
