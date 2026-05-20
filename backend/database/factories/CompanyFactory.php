<?php

namespace Database\Factories;

use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;

class CompanyFactory extends Factory
{
    protected $model = Company::class;

    public function definition(): array
    {
        return [
            'name'           => fake()->company(),
            'nit'            => fake()->numerify('9##.###.###-#'),
            'is_distributor' => false,
            'is_active'      => true,
        ];
    }

    public function distributor(): static
    {
        return $this->state(['is_distributor' => true]);
    }
}
