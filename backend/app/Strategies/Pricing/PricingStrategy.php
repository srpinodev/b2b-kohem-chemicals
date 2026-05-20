<?php

namespace App\Strategies\Pricing;

use App\Models\Product;

interface PricingStrategy
{
    public function calculateUnitPrice(Product $product, int $quantity): float;

    public function name(): string;
}
