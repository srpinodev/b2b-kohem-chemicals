<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Order;
use App\Models\User;
use App\Notifications\OrderStatusNotification;
use App\Services\NotificationService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private User $cliente;
    private string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $company = Company::factory()->create();
        $this->cliente = User::factory()->create(['company_id' => $company->id]);
        $this->cliente->assignRole('cliente');
        $this->token = JWTAuth::fromUser($this->cliente);
    }

    public function test_notifications_endpoint_returns_empty_for_new_user(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/notifications');

        $response->assertOk()
            ->assertJsonPath('total', 0);
    }

    public function test_order_status_notification_stored_in_database(): void
    {
        Notification::fake();

        $order = Order::factory()->create([
            'user_id'    => $this->cliente->id,
            'company_id' => $this->cliente->company_id,
            'status'     => 'pending',
        ]);

        $service = app(NotificationService::class);
        $service->notifyOrderStatusChange($order, 'pending', 'confirmed');

        Notification::assertSentTo($this->cliente, OrderStatusNotification::class);
    }

    public function test_mark_notification_as_read(): void
    {
        $order = Order::factory()->create([
            'user_id'    => $this->cliente->id,
            'company_id' => $this->cliente->company_id,
            'status'     => 'confirmed',
        ]);

        $this->cliente->notify(new OrderStatusNotification($order, 'pending', 'confirmed'));

        $notification = $this->cliente->notifications()->first();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->patchJson("/api/notifications/{$notification->id}/read");

        $response->assertOk();
        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_mark_all_read(): void
    {
        $order = Order::factory()->create([
            'user_id'    => $this->cliente->id,
            'company_id' => $this->cliente->company_id,
            'status'     => 'confirmed',
        ]);

        $this->cliente->notify(new OrderStatusNotification($order, 'pending', 'confirmed'));
        $this->cliente->notify(new OrderStatusNotification($order, 'confirmed', 'processing'));

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/notifications/read-all');

        $response->assertOk()->assertJsonPath('marked', 2);
        $this->assertEquals(0, $this->cliente->fresh()->unreadNotifications()->count());
    }

    public function test_chatbot_returns_reply(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/chatbot/message', ['message' => 'hola']);

        $response->assertOk()
            ->assertJsonStructure(['reply', 'session_id']);
    }
}
