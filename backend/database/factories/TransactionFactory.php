<?php

namespace Database\Factories;

use App\Models\Invoice;
use App\Models\Order;
use App\Models\Transaction;
use Illuminate\Database\Eloquent\Factories\Factory;

class TransactionFactory extends Factory
{
    protected $model = Transaction::class;

    public function definition(): array
    {
        return [
            'order_id'    => Order::factory(),
            'invoice_id'  => Invoice::factory(),
            'gateway'     => 'stripe',
            'gateway_id'  => 'cs_test_'.fake()->bothify('##??##??##??'),
            'status'      => 'pending',
            'amount'      => fake()->randomFloat(2, 50_000, 500_000),
            'currency'    => 'COP',
            'checkout_url' => 'https://checkout.stripe.com/pay/test',
        ];
    }
}
