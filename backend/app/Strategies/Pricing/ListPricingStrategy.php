<?php

namespace App\Strategies\Pricing;

use App\Models\Product;

class ListPricingStrategy implements PricingStrategy
{
    public function calculateUnitPrice(Product $product, int $quantity): float
    {
        return (float) $product->price;
    }

    public function name(): string
    {
        return 'list';
    }
}
