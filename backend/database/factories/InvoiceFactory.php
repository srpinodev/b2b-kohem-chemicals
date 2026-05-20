<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Invoice;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        $subtotal   = fake()->randomFloat(2, 50_000, 500_000);
        $taxAmount  = round($subtotal * 0.19, 2);
        $seq        = fake()->unique()->numberBetween(1, 99999);

        return [
            'order_id'       => Order::factory(),
            'company_id'     => Company::factory(),
            'invoice_number' => 'FAC-'.str_pad((string) $seq, 6, '0', STR_PAD_LEFT),
            'type'           => 'invoice',
            'status'         => 'issued',
            'subtotal'       => $subtotal,
            'tax_rate'       => 0.1900,
            'tax_amount'     => $taxAmount,
            'total'          => round($subtotal + $taxAmount, 2),
            'issued_at'      => now()->toDateString(),
            'due_date'       => now()->addDays(30)->toDateString(),
        ];
    }
}
