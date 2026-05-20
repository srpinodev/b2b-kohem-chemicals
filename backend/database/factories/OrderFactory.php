<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 50_000, 500_000);
        $tax      = round($subtotal * 0.19, 2);

        return [
            'order_number'     => 'ORD-'.strtoupper(fake()->bothify('####??')),
            'user_id'          => User::factory(),
            'company_id'       => Company::factory(),
            'type'             => 'direct',
            'status'           => 'pending',
            'pricing_strategy' => 'list',
            'subtotal'         => $subtotal,
            'tax_amount'       => $tax,
            'total'            => round($subtotal + $tax, 2),
            'notes'            => null,
        ];
    }
}
