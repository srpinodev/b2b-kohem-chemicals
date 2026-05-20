<?php

namespace Tests\Feature\Catalog;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->category = Category::create(['name' => 'Ácidos', 'slug' => 'acidos']);
    }

    private function makeProduct(array $overrides = []): Product
    {
        return Product::create(array_merge([
            'category_id' => $this->category->id,
            'sku' => 'TEST-001',
            'name' => 'Ácido Test',
            'cas_number' => '1234-56-7',
            'unit' => 'kg',
            'price' => 5000,
            'stock' => 100,
            'is_active' => true,
        ], $overrides));
    }

    private function adminToken(): string
    {
        $admin = User::factory()->create();
        $admin->assignRole('administrador');

        return JWTAuth::fromUser($admin);
    }

    public function test_catalog_lists_active_products(): void
    {
        $this->makeProduct();
        $this->makeProduct(['sku' => 'TEST-002', 'name' => 'Otro Producto']);

        $this->getJson('/api/catalog')
            ->assertOk()
            ->assertJsonPath('total', 2);
    }

    public function test_catalog_hides_inactive_products(): void
    {
        $this->makeProduct(['is_active' => false]);

        $this->getJson('/api/catalog')
            ->assertOk()
            ->assertJsonPath('total', 0);
    }

    public function test_catalog_search_by_name(): void
    {
        $this->makeProduct(['sku' => 'A1', 'name' => 'Sulfurico Industrial']);
        $this->makeProduct(['sku' => 'A2', 'name' => 'Clorhidrico Grado', 'cas_number' => null]);

        $this->getJson('/api/catalog?search=sulfur')
            ->assertOk()
            ->assertJsonPath('total', 1);
    }

    public function test_catalog_search_by_cas(): void
    {
        $this->makeProduct(['cas_number' => '7664-93-9']);

        $this->getJson('/api/catalog?search=7664-93-9')
            ->assertOk()
            ->assertJsonPath('total', 1);
    }

    public function test_catalog_filter_by_category(): void
    {
        $other = Category::create(['name' => 'Bases', 'slug' => 'bases']);
        $this->makeProduct(['sku' => 'A1']);
        $this->makeProduct(['sku' => 'B1', 'category_id' => $other->id]);

        $this->getJson('/api/catalog?category_id='.$this->category->id)
            ->assertOk()
            ->assertJsonPath('total', 1);
    }

    public function test_show_product_by_sku(): void
    {
        $this->makeProduct();

        $this->getJson('/api/catalog/TEST-001')
            ->assertOk()
            ->assertJsonPath('sku', 'TEST-001')
            ->assertJsonPath('category.name', 'Ácidos');
    }

    public function test_show_returns_404_for_unknown_sku(): void
    {
        $this->getJson('/api/catalog/NOT-FOUND')->assertStatus(404);
    }

    public function test_admin_can_create_product(): void
    {
        $token = $this->adminToken();

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/admin/products', [
                'sku' => 'NEW-001',
                'name' => 'Nuevo Producto',
                'unit' => 'L',
                'price' => 3000,
                'stock' => 200,
            ])
            ->assertStatus(201)
            ->assertJsonPath('sku', 'NEW-001');
    }

    public function test_admin_can_update_product(): void
    {
        $product = $this->makeProduct();
        $token = $this->adminToken();

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson('/api/admin/products/'.$product->id, ['price' => 9999])
            ->assertOk()
            ->assertJsonPath('price', '9999.00');
    }

    public function test_admin_can_delete_product(): void
    {
        $product = $this->makeProduct();
        $token = $this->adminToken();

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson('/api/admin/products/'.$product->id)
            ->assertOk();

        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }

    public function test_cliente_cannot_create_product(): void
    {
        $user = User::factory()->create();
        $user->assignRole('cliente');
        $token = JWTAuth::fromUser($user);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/admin/products', [
                'sku' => 'HACK-001',
                'name' => 'Hack',
                'unit' => 'kg',
                'price' => 1,
                'stock' => 1,
            ])
            ->assertStatus(403);
    }

    public function test_catalog_is_accessible_without_auth(): void
    {
        $this->makeProduct();
        $this->getJson('/api/catalog')->assertOk();
    }
}
