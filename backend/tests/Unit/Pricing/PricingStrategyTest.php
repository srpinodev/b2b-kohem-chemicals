<?php

namespace Tests\Unit\Pricing;

use App\Models\Product;
use App\Strategies\Pricing\DistributorPricingStrategy;
use App\Strategies\Pricing\ListPricingStrategy;
use App\Strategies\Pricing\VolumePricingStrategy;
use PHPUnit\Framework\TestCase;

class PricingStrategyTest extends TestCase
{
    private function product(float $price): Product
    {
        $p = new Product;
        $p->price = $price;

        return $p;
    }

    public function test_list_strategy_returns_full_price(): void
    {
        $strategy = new ListPricingStrategy;
        $this->assertEquals(5000.0, $strategy->calculateUnitPrice($this->product(5000), 1));
        $this->assertEquals(5000.0, $strategy->calculateUnitPrice($this->product(5000), 1000));
    }

    public function test_distributor_strategy_applies_15_percent_discount(): void
    {
        $strategy = new DistributorPricingStrategy;
        $this->assertEquals(4250.0, $strategy->calculateUnitPrice($this->product(5000), 1));
        $this->assertEquals(4250.0, $strategy->calculateUnitPrice($this->product(5000), 500));
    }

    public function test_volume_strategy_no_discount_below_100(): void
    {
        $strategy = new VolumePricingStrategy;
        $this->assertEquals(5000.0, $strategy->calculateUnitPrice($this->product(5000), 50));
        $this->assertEquals(5000.0, $strategy->calculateUnitPrice($this->product(5000), 99));
    }

    public function test_volume_strategy_5_percent_at_100(): void
    {
        $strategy = new VolumePricingStrategy;
        $this->assertEquals(4750.0, $strategy->calculateUnitPrice($this->product(5000), 100));
        $this->assertEquals(4750.0, $strategy->calculateUnitPrice($this->product(5000), 499));
    }

    public function test_volume_strategy_10_percent_at_500(): void
    {
        $strategy = new VolumePricingStrategy;
        $this->assertEquals(4500.0, $strategy->calculateUnitPrice($this->product(5000), 500));
        $this->assertEquals(4500.0, $strategy->calculateUnitPrice($this->product(5000), 1000));
    }

    public function test_strategy_names(): void
    {
        $this->assertEquals('list', (new ListPricingStrategy)->name());
        $this->assertEquals('distributor', (new DistributorPricingStrategy)->name());
        $this->assertEquals('volume', (new VolumePricingStrategy)->name());
    }
}
