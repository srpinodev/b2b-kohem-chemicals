<?php

namespace App\Strategies\Pricing;

use App\Models\Product;

class VolumePricingStrategy implements PricingStrategy
{
    // Tiered discounts based on quantity
    private const TIERS = [
        500  => 0.10, // >= 500 units → 10% off
        100  => 0.05, // >= 100 units → 5% off
        0    => 0.00, // < 100 units  → no discount
    ];

    public function calculateUnitPrice(Product $product, int $quantity): float
    {
        $discount = 0.0;
        foreach (self::TIERS as $threshold => $rate) {
            if ($quantity >= $threshold) {
                $discount = $rate;
                break;
            }
        }

        return round((float) $product->price * (1 - $discount), 2);
    }

    public function name(): string
    {
        return 'volume';
    }
}
