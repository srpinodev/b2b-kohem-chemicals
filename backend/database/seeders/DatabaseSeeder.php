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

        // Demo company
        $company = Company::firstOrCreate(
            ['nit' => '900123456-7'],
            [
                'name' => 'Químicos Demo S.A.S',
                'address' => 'Calle 80 # 45-23',
                'city' => 'Bogotá',
                'phone' => '3001234567',
                'contact_name' => 'Carlos Demo',
                'is_distributor' => false,
            ]
        );

        // Admin user
        $admin = User::firstOrCreate(
            ['email' => 'admin@kohem.co'],
            [
                'name' => 'Administrador Kohem',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $admin->syncRoles(['administrador']);

        // Vendedor user
        $vendedor = User::firstOrCreate(
            ['email' => 'vendedor@kohem.co'],
            [
                'name' => 'Vendedor Demo',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $vendedor->syncRoles(['vendedor']);

        // Cliente user
        $cliente = User::firstOrCreate(
            ['email' => 'cliente@demo.co'],
            [
                'name' => 'Cliente Demo',
                'password' => Hash::make('password'),
                'company_id' => $company->id,
                'is_active' => true,
            ]
        );
        $cliente->syncRoles(['cliente']);
    }
}
