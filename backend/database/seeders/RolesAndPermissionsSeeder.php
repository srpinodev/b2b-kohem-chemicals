<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        Role::firstOrCreate(['name' => 'cliente', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'vendedor', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'administrador', 'guard_name' => 'api']);
    }
}
