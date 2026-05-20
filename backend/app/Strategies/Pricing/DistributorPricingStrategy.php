<?php

namespace App\Strategies\Pricing;

use App\Models\Product;

class DistributorPricingStrategy implements PricingStrategy
{
    private const DISCOUNT = 0.15; // 15% off list price

    public function calculateUnitPrice(Product $product, int $quantity): float
    {
        return round((float) $product->price * (1 - self::DISCOUNT), 2);
    }

    public function name(): string
    {
        return 'distributor';
    }
}
