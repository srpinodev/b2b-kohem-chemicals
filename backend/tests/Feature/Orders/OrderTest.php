<?php

namespace Tests\Feature\Orders;

use App\Events\OrderConfirmed;
use App\Events\OrderStatusChanged;
use App\Models\Category;
use App\Models\Company;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $cat = Category::create(['name' => 'Test', 'slug' => 'test']);
        $this->product = Product::create([
            'category_id' => $cat->id, 'sku' => 'TEST-001', 'name' => 'Producto Test',
            'unit' => 'kg', 'price' => 10000, 'stock' => 500, 'is_active' => true,
        ]);
    }

    private function clienteToken(?Company $company = null): array
    {
        $user = User::factory()->create(['company_id' => $company?->id]);
        $user->assignRole('cliente');
        return [$user, JWTAuth::fromUser($user)];
    }

    private function adminToken(): array
    {
        $user = User::factory()->create();
        $user->assignRole('administrador');
        return [$user, JWTAuth::fromUser($user)];
    }

    public function test_cliente_can_create_order(): void
    {
        [, $token] = $this->clienteToken();

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/orders', [
                'items' => [['product_id' => $this->product->id, 'quantity' => 10]],
            ])
            ->assertStatus(201)
            ->assertJsonPath('status', 'pending')
            ->assertJsonPath('type', 'direct');
    }

    public function test_distributor_order_uses_distributor_factory(): void
    {
        $company = Company::create(['name' => 'Dist SA', 'nit' => '123', 'is_distributor' => true]);
        [, $token] = $this->clienteToken($company);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/orders', [
                'items' => [['product_id' => $this->product->id, 'quantity' => 5]],
            ])
            ->assertStatus(201);

        $this->assertEquals('distributor', $response->json('type'));
        $this->assertEquals('distributor', $response->json('pricing_strategy'));
    }

    public function test_volume_pricing_applied_for_direct_client(): void
    {
        [, $token] = $this->clienteToken();

        // 500+ units → 10% discount → 9000 per unit
        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/orders', [
                'items' => [['product_id' => $this->product->id, 'quantity' => 500]],
            ])
            ->assertStatus(201);

        $subtotal = (float) $response->json('subtotal');
        $this->assertEquals(500 * 9000, $subtotal);
    }

    public function test_order_fails_with_insufficient_stock(): void
    {
        [, $token] = $this->clienteToken();

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/orders', [
                'items' => [['product_id' => $this->product->id, 'quantity' => 9999]],
            ])
            ->assertStatus(422);
    }

    public function test_tax_is_19_percent(): void
    {
        [, $token] = $this->clienteToken();

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/orders', [
                'items' => [['product_id' => $this->product->id, 'quantity' => 1]],
            ])
            ->assertStatus(201);

        $subtotal = (float) $response->json('subtotal');
        $tax = (float) $response->json('tax_amount');
        $this->assertEqualsWithDelta($subtotal * 0.19, $tax, 0.01);
    }

    public function test_order_status_transition(): void
    {
        Event::fake([OrderStatusChanged::class, OrderConfirmed::class]);
        [$admin, $adminToken] = $this->adminToken();
        [, $clientToken] = $this->clienteToken();

        // Create order as client
        $order = $this->withHeader('Authorization', 'Bearer '.$clientToken)
            ->postJson('/api/orders', ['items' => [['product_id' => $this->product->id, 'quantity' => 1]]])
            ->assertStatus(201);

        $orderId = $order->json('id');

        // Confirm as admin
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->patchJson("/api/orders/$orderId/status", ['status' => 'confirmed'])
            ->assertOk()
            ->assertJsonPath('status', 'confirmed');

        Event::assertDispatched(OrderConfirmed::class);
        Event::assertDispatched(OrderStatusChanged::class);
    }

    public function test_invalid_status_transition_rejected(): void
    {
        [, $adminToken] = $this->adminToken();
        [, $clientToken] = $this->clienteToken();

        $order = $this->withHeader('Authorization', 'Bearer '.$clientToken)
            ->postJson('/api/orders', ['items' => [['product_id' => $this->product->id, 'quantity' => 1]]])
            ->json();

        // pending → shipped is not a valid transition
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->patchJson("/api/orders/{$order['id']}/status", ['status' => 'shipped'])
            ->assertStatus(422);
    }

    public function test_traceability_log_is_written_on_transition(): void
    {
        [, $adminToken] = $this->adminToken();
        [, $clientToken] = $this->clienteToken();

        $order = $this->withHeader('Authorization', 'Bearer '.$clientToken)
            ->postJson('/api/orders', ['items' => [['product_id' => $this->product->id, 'quantity' => 1]]])
            ->json();

        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->patchJson("/api/orders/{$order['id']}/status", ['status' => 'confirmed']);

        $this->assertDatabaseHas('order_state_logs', [
            'order_id'   => $order['id'],
            'to_status'  => 'confirmed',
        ]);
    }

    public function test_cliente_cannot_see_other_users_orders(): void
    {
        [, $token1] = $this->clienteToken();
        [, $token2] = $this->clienteToken();

        $order = $this->withHeader('Authorization', 'Bearer '.$token1)
            ->postJson('/api/orders', ['items' => [['product_id' => $this->product->id, 'quantity' => 1]]])
            ->json();

        $this->withHeader('Authorization', 'Bearer '.$token2)
            ->getJson('/api/orders/'.$order['id'])
            ->assertStatus(403);
    }
}
