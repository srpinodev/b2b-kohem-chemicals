<?php

namespace Tests\Unit;

use App\Models\Company;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Services\InvoiceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceServiceTest extends TestCase
{
    use RefreshDatabase;

    private InvoiceService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new InvoiceService;
    }

    public function test_iva_19_percent_calculated_correctly(): void
    {
        $order = $this->makeOrderWithSubtotal(100_000.00);

        $invoice = $this->service->createFromOrder($order);

        $this->assertEquals('19000.00', $invoice->tax_amount);
        $this->assertEquals('119000.00', $invoice->total);
        $this->assertEquals('0.1900', $invoice->tax_rate);
    }

    public function test_iva_rounds_correctly_on_fractional_subtotal(): void
    {
        // round(1000.53 * 0.19, 2) = round(190.1007, 2) = 190.10
        $order = $this->makeOrderWithSubtotal(1_000.53);

        $invoice = $this->service->createFromOrder($order);

        $this->assertEquals('190.10', $invoice->tax_amount);
        $this->assertEquals('1190.63', $invoice->total);
    }

    public function test_invoice_number_prefix_matches_type(): void
    {
        $order = $this->makeOrderWithSubtotal(50_000.00);

        $invoice    = $this->service->createFromOrder($order, 'invoice');
        $proforma   = $this->service->createFromOrder($order, 'proforma');
        $creditNote = $this->service->createFromOrder($order, 'credit_note');

        $this->assertStringStartsWith('FAC-', $invoice->invoice_number);
        $this->assertStringStartsWith('PRO-', $proforma->invoice_number);
        $this->assertStringStartsWith('NC-',  $creditNote->invoice_number);
    }

    public function test_invoice_numbers_increment_sequentially(): void
    {
        $order = $this->makeOrderWithSubtotal(50_000.00);

        $first  = $this->service->createFromOrder($order);
        $second = $this->service->createFromOrder($order);

        $this->assertEquals('FAC-000001', $first->invoice_number);
        $this->assertEquals('FAC-000002', $second->invoice_number);
    }

    public function test_creates_invoice_with_correct_company_and_order(): void
    {
        $order = $this->makeOrderWithSubtotal(200_000.00);

        $invoice = $this->service->createFromOrder($order);

        $this->assertEquals($order->id, $invoice->order_id);
        $this->assertEquals($order->company_id, $invoice->company_id);
        $this->assertEquals('issued', $invoice->status);
    }

    private function makeOrderWithSubtotal(float $subtotal): Order
    {
        $company = Company::factory()->create(['is_distributor' => false]);
        $user    = User::factory()->create(['company_id' => $company->id]);

        $order = Order::factory()->create([
            'company_id' => $company->id,
            'user_id'    => $user->id,
            'subtotal'   => $subtotal,
            'tax_amount' => round($subtotal * 0.19, 2),
            'total'      => round($subtotal * 1.19, 2),
            'status'     => 'confirmed',
        ]);

        return $order;
    }
}
