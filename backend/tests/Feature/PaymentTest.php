<?php

namespace Tests\Feature;

use App\Adapters\Payment\CheckoutResult;
use App\Adapters\Payment\PaymentGateway;
use App\Adapters\Payment\WebhookResult;
use App\Models\Company;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Transaction;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class PaymentTest extends TestCase
{
    use RefreshDatabase;

    private User $cliente;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $company = Company::factory()->create(['is_distributor' => false]);
        $this->cliente = User::factory()->create(['company_id' => $company->id]);
        $this->cliente->assignRole('cliente');
    }

    private function actingAsCliente(): string
    {
        return JWTAuth::fromUser($this->cliente);
    }

    public function test_checkout_creates_transaction_and_returns_checkout_url(): void
    {
        $order = Order::factory()->create([
            'company_id' => $this->cliente->company_id,
            'user_id'    => $this->cliente->id,
            'status'     => 'confirmed',
            'subtotal'   => 100_000.00,
            'tax_amount' => 19_000.00,
            'total'      => 119_000.00,
        ]);

        $this->app->instance(PaymentGateway::class, $this->mockGateway(
            new CheckoutResult('cs_test_123', 'https://checkout.stripe.com/test')
        ));

        $token = $this->actingAsCliente();

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson("/api/orders/{$order->id}/checkout", [
                'success_url' => 'http://localhost:5173/payment/success',
                'cancel_url'  => 'http://localhost:5173/payment/cancel',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('checkout_url', 'https://checkout.stripe.com/test')
            ->assertJsonPath('transaction.gateway', 'stripe')
            ->assertJsonPath('transaction.status', 'pending');

        $this->assertDatabaseHas('transactions', [
            'order_id'   => $order->id,
            'gateway'    => 'stripe',
            'gateway_id' => 'cs_test_123',
            'status'     => 'pending',
        ]);
    }

    public function test_checkout_rejected_for_pending_order(): void
    {
        $order = Order::factory()->create([
            'company_id' => $this->cliente->company_id,
            'user_id'    => $this->cliente->id,
            'status'     => 'pending',
            'subtotal'   => 50_000.00,
            'tax_amount' => 9_500.00,
            'total'      => 59_500.00,
        ]);

        $token = $this->actingAsCliente();

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson("/api/orders/{$order->id}/checkout", [
                'success_url' => 'http://localhost:5173/payment/success',
                'cancel_url'  => 'http://localhost:5173/payment/cancel',
            ]);

        $response->assertStatus(422);
    }

    public function test_webhook_marks_invoice_paid_on_success(): void
    {
        $invoice = Invoice::factory()->create(['status' => 'issued', 'total' => 119_000.00]);
        $transaction = Transaction::factory()->create([
            'invoice_id' => $invoice->id,
            'gateway_id' => 'cs_test_abc',
            'status'     => 'pending',
        ]);

        $this->app->instance(PaymentGateway::class, $this->mockWebhookGateway(
            new WebhookResult('cs_test_abc', 'succeeded', [])
        ));

        $response = $this->postJson('/api/webhooks/stripe', [], [
            'Stripe-Signature' => 'test_sig',
        ]);

        $response->assertOk()->assertJsonPath('processed', true);

        $this->assertDatabaseHas('transactions', ['gateway_id' => 'cs_test_abc', 'status' => 'succeeded']);
        $this->assertDatabaseHas('invoices', ['id' => $invoice->id, 'status' => 'paid']);
    }

    public function test_webhook_returns_received_false_for_unknown_event(): void
    {
        $this->app->instance(PaymentGateway::class, $this->mockWebhookGateway(null));

        $response = $this->postJson('/api/webhooks/stripe', [], ['Stripe-Signature' => 'sig']);

        $response->assertOk()->assertJsonPath('processed', false);
    }

    private function mockGateway(CheckoutResult $checkoutResult): PaymentGateway
    {
        $mock = $this->createMock(PaymentGateway::class);
        $mock->method('createCheckoutSession')->willReturn($checkoutResult);
        $mock->method('name')->willReturn('stripe');

        return $mock;
    }

    private function mockWebhookGateway(?WebhookResult $result): PaymentGateway
    {
        $mock = $this->createMock(PaymentGateway::class);
        $mock->method('parseWebhook')->willReturn($result);
        $mock->method('name')->willReturn('stripe');

        return $mock;
    }
}
