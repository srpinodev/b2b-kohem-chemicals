<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Juan Pérez',
            'email' => 'juan@test.co',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'user', 'token'])
            ->assertJsonPath('user.email', 'juan@test.co');
    }

    public function test_registered_user_gets_cliente_role(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Ana García',
            'email' => 'ana@test.co',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $user = User::where('email', 'ana@test.co')->first();
        $this->assertTrue($user->hasRole('cliente'));
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create(['password' => bcrypt('secret')]);
        $user->assignRole('cliente');

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'secret',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['user', 'token', 'requires_2fa']);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $user = User::factory()->create(['password' => bcrypt('correct')]);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'wrong',
        ])->assertStatus(401);
    }

    public function test_login_fails_for_inactive_user(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('password'),
            'is_active' => false,
        ]);
        $user->assignRole('cliente');

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertStatus(401);
    }

    public function test_me_returns_authenticated_user(): void
    {
        $user = User::factory()->create();
        $user->assignRole('cliente');
        $token = JWTAuth::fromUser($user);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('email', $user->email);
    }

    public function test_me_fails_without_token(): void
    {
        $this->getJson('/api/me')->assertStatus(401);
    }

    public function test_user_can_logout(): void
    {
        $user = User::factory()->create();
        $user->assignRole('cliente');
        $token = JWTAuth::fromUser($user);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/auth/logout')
            ->assertOk();
    }

    public function test_register_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'dup@test.co']);

        $this->postJson('/api/auth/register', [
            'name' => 'Otro',
            'email' => 'dup@test.co',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(422);
    }

    public function test_rbac_blocks_unauthorized_role(): void
    {
        $user = User::factory()->create();
        $user->assignRole('cliente');
        $token = JWTAuth::fromUser($user);

        // Admin route should reject a cliente
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/admin/products')
            ->assertStatus(403);
    }

    public function test_setup2fa_rotates_secret_when_not_yet_enabled(): void
    {
        $user = User::factory()->create();
        $user->assignRole('cliente');
        $token = JWTAuth::fromUser($user);

        $first = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/auth/2fa/setup');
        $first->assertStatus(200)->assertJsonStructure(['secret', 'qr_code_url']);

        // Mientras no esté activado, un segundo setup debe poder rotar el secret.
        $second = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/auth/2fa/setup');
        $second->assertStatus(200);
        $this->assertNotEquals(
            $first->json('secret'),
            $second->json('secret'),
            'Setup debe regenerar el secret antes de activar.',
        );
    }

    public function test_setup2fa_rejects_when_already_enabled(): void
    {
        $user = User::factory()->create(['two_factor_enabled' => true]);
        $user->assignRole('cliente');
        $token = JWTAuth::fromUser($user);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/auth/2fa/setup')
            ->assertStatus(422)
            ->assertJsonPath('message', '2FA ya está activado. Pide a un administrador que lo resetee antes de configurarlo de nuevo.');
    }

    public function test_admin_can_reset_user_2fa(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('administrador');
        $target = User::factory()->create([
            'two_factor_enabled' => true,
            'google2fa_secret'   => 'JBSWY3DPEHPK3PXP',
        ]);
        $target->assignRole('cliente');

        $token = JWTAuth::fromUser($admin);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/admin/users/{$target->id}/reset-2fa")
            ->assertStatus(200)
            ->assertJsonPath('user.two_factor_enabled', false);

        $this->assertFalse((bool) $target->fresh()->two_factor_enabled);
        $this->assertNull($target->fresh()->google2fa_secret);
    }

    public function test_admin_cannot_reset_own_2fa(): void
    {
        $admin = User::factory()->create([
            'two_factor_enabled' => true,
            'google2fa_secret'   => 'JBSWY3DPEHPK3PXP',
        ]);
        $admin->assignRole('administrador');
        $token = JWTAuth::fromUser($admin);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/admin/users/{$admin->id}/reset-2fa")
            ->assertStatus(422);
    }

    public function test_reset_2fa_rejects_when_user_has_no_2fa(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('administrador');
        $target = User::factory()->create(['two_factor_enabled' => false, 'google2fa_secret' => null]);
        $target->assignRole('cliente');
        $token = JWTAuth::fromUser($admin);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/admin/users/{$target->id}/reset-2fa")
            ->assertStatus(422)
            ->assertJsonPath('message', 'El usuario no tiene 2FA configurado.');
    }

    public function test_non_admin_cannot_reset_2fa(): void
    {
        $vendor = User::factory()->create();
        $vendor->assignRole('vendedor');
        $target = User::factory()->create(['two_factor_enabled' => true, 'google2fa_secret' => 'JBSWY3DPEHPK3PXP']);
        $target->assignRole('cliente');
        $token = JWTAuth::fromUser($vendor);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson("/api/admin/users/{$target->id}/reset-2fa")
            ->assertStatus(403);
    }
}
