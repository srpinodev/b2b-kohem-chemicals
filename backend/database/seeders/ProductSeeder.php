<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Ácidos', 'slug' => 'acidos', 'description' => 'Ácidos inorgánicos y orgánicos industriales'],
            ['name' => 'Bases', 'slug' => 'bases', 'description' => 'Hidróxidos y bases industriales'],
            ['name' => 'Solventes', 'slug' => 'solventes', 'description' => 'Solventes orgánicos e industriales'],
            ['name' => 'Oxidantes', 'slug' => 'oxidantes', 'description' => 'Agentes oxidantes y blanqueadores'],
        ];

        foreach ($categories as $cat) {
            Category::firstOrCreate(['slug' => $cat['slug']], $cat);
        }

        $acidos = Category::where('slug', 'acidos')->first();
        $bases = Category::where('slug', 'bases')->first();
        $solventes = Category::where('slug', 'solventes')->first();
        $oxidantes = Category::where('slug', 'oxidantes')->first();

        $products = [
            [
                'category_id' => $acidos->id,
                'sku' => 'ACI-H2SO4-001',
                'name' => 'Ácido Sulfúrico 98%',
                'cas_number' => '7664-93-9',
                'description' => 'Ácido sulfúrico concentrado 98% técnico. Uso industrial para síntesis química y tratamiento de metales.',
                'unit' => 'kg',
                'price' => 4500.00,
                'stock' => 2000,
                'requires_special_handling' => true,
            ],
            [
                'category_id' => $acidos->id,
                'sku' => 'ACI-HCL-001',
                'name' => 'Ácido Clorhídrico 37%',
                'cas_number' => '7647-01-0',
                'description' => 'Ácido clorhídrico solución acuosa 37% (ácido muriático). Uso en limpieza industrial y síntesis.',
                'unit' => 'L',
                'price' => 3200.00,
                'stock' => 1500,
                'requires_special_handling' => true,
            ],
            [
                'category_id' => $acidos->id,
                'sku' => 'ACI-HNO3-001',
                'name' => 'Ácido Nítrico 65%',
                'cas_number' => '7697-37-2',
                'description' => 'Ácido nítrico técnico 65%. Uso en síntesis orgánica y galvanoplastia.',
                'unit' => 'L',
                'price' => 5800.00,
                'stock' => 800,
                'requires_special_handling' => true,
            ],
            [
                'category_id' => $bases->id,
                'sku' => 'BAS-NAOH-001',
                'name' => 'Hidróxido de Sodio (Soda Cáustica)',
                'cas_number' => '1310-73-2',
                'description' => 'Hidróxido de sodio escamas 99%. Uso en fabricación de jabones, papel y tratamiento de agua.',
                'unit' => 'kg',
                'price' => 2800.00,
                'stock' => 5000,
                'requires_special_handling' => true,
            ],
            [
                'category_id' => $bases->id,
                'sku' => 'BAS-NH3-001',
                'name' => 'Hidróxido de Amonio 28%',
                'cas_number' => '1336-21-6',
                'description' => 'Solución amoniacal 28%. Uso en limpieza industrial y síntesis química.',
                'unit' => 'L',
                'price' => 1900.00,
                'stock' => 1200,
                'requires_special_handling' => false,
            ],
            [
                'category_id' => $solventes->id,
                'sku' => 'SOL-ACET-001',
                'name' => 'Acetona Industrial',
                'cas_number' => '67-64-1',
                'description' => 'Acetona técnica 99.5%. Solvente universal para limpieza y síntesis orgánica.',
                'unit' => 'L',
                'price' => 3500.00,
                'stock' => 3000,
                'requires_special_handling' => false,
            ],
            [
                'category_id' => $solventes->id,
                'sku' => 'SOL-ETOH-001',
                'name' => 'Etanol Industrial 96°',
                'cas_number' => '64-17-5',
                'description' => 'Alcohol etílico 96° desnaturalizado. Uso en limpieza, desinfección e industria.',
                'unit' => 'L',
                'price' => 4200.00,
                'stock' => 4000,
                'requires_special_handling' => false,
            ],
            [
                'category_id' => $oxidantes->id,
                'sku' => 'OXI-H2O2-001',
                'name' => 'Peróxido de Hidrógeno 50%',
                'cas_number' => '7722-84-1',
                'description' => 'Agua oxigenada 50% técnica. Uso en blanqueo, desinfección y síntesis.',
                'unit' => 'kg',
                'price' => 6200.00,
                'stock' => 600,
                'requires_special_handling' => true,
            ],
            [
                'category_id' => $oxidantes->id,
                'sku' => 'OXI-NACLO-001',
                'name' => 'Hipoclorito de Sodio 13%',
                'cas_number' => '7681-52-9',
                'description' => 'Hipoclorito de sodio solución 13% cloro activo. Blanqueador industrial y desinfectante.',
                'unit' => 'L',
                'price' => 1400.00,
                'stock' => 8000,
                'requires_special_handling' => false,
            ],
            [
                'category_id' => $acidos->id,
                'sku' => 'ACI-H3PO4-001',
                'name' => 'Ácido Fosfórico 85%',
                'cas_number' => '7664-38-2',
                'description' => 'Ácido fosfórico 85% técnico. Uso en tratamiento de metales, alimentos e industria química.',
                'unit' => 'kg',
                'price' => 7100.00,
                'stock' => 900,
                'requires_special_handling' => false,
            ],
        ];

        foreach ($products as $data) {
            Product::firstOrCreate(['sku' => $data['sku']], array_merge($data, ['is_active' => true]));
        }
    }
}
