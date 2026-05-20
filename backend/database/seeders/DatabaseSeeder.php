<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RolesAndPermissionsSeeder::class);
        $this->call(ProductSeeder::class);

        // ── Staff (no company) ──────────────────────────────────────────────
        $admin = User::firstOrCreate(
            ['email' => 'admin@kohem.co'],
            ['name' => 'Administrador Kohem', 'password' => Hash::make('password'), 'is_active' => true]
        );
        $admin->syncRoles(['administrador']);

        $vendedor = User::firstOrCreate(
            ['email' => 'vendedor@kohem.co'],
            ['name' => 'Vendedor Demo', 'password' => Hash::make('password'), 'is_active' => true]
        );
        $vendedor->syncRoles(['vendedor']);

        // ── Cliente 1 — Empresa cliente directa ─────────────────────────────
        $c1 = Company::firstOrCreate(
            ['nit' => '900123456-7'],
            [
                'name'          => 'Laboratorios Andinos S.A.S',
                'address'       => 'Calle 80 # 45-23, Bogotá',
                'city'          => 'Bogotá',
                'phone'         => '6013001234',
                'contact_name'  => 'Carlos Pérez',
                'is_distributor' => false,
                'is_active'     => true,
            ]
        );
        $u1 = User::firstOrCreate(
            ['email' => 'cliente@demo.co'],
            ['name' => 'Carlos Pérez', 'password' => Hash::make('password'), 'company_id' => $c1->id, 'is_active' => true]
        );
        $u1->syncRoles(['cliente']);

        // ── Cliente 2 — Industria química mediana ───────────────────────────
        $c2 = Company::firstOrCreate(
            ['nit' => '800987654-3'],
            [
                'name'          => 'Química Industrial del Valle S.A',
                'address'       => 'Carrera 15 # 22-44, Cali',
                'city'          => 'Cali',
                'phone'         => '6022005678',
                'contact_name'  => 'Mariana Ruiz',
                'is_distributor' => false,
                'is_active'     => true,
            ]
        );
        $u2 = User::firstOrCreate(
            ['email' => 'cliente2@demo.co'],
            ['name' => 'Mariana Ruiz', 'password' => Hash::make('password'), 'company_id' => $c2->id, 'is_active' => true]
        );
        $u2->syncRoles(['cliente']);

        // ── Cliente 3 — Distribuidor ─────────────────────────────────────────
        $c3 = Company::firstOrCreate(
            ['nit' => '701234567-1'],
            [
                'name'          => 'Distribuidora Nacional de Reactivos Ltda',
                'address'       => 'Zona Industrial # 5-60, Barranquilla',
                'city'          => 'Barranquilla',
                'phone'         => '6053009999',
                'contact_name'  => 'Andrés Molina',
                'is_distributor' => true,
                'is_active'     => true,
            ]
        );
        $u3 = User::firstOrCreate(
            ['email' => 'distribuidor@demo.co'],
            ['name' => 'Andrés Molina', 'password' => Hash::make('password'), 'company_id' => $c3->id, 'is_active' => true]
        );
        $u3->syncRoles(['cliente']);
    }
}
