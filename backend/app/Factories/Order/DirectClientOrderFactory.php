<?php

namespace App\Factories\Order;

use App\Models\Order;
use App\Models\User;
use App\Strategies\Pricing\ListPricingStrategy;
use App\Strategies\Pricing\PricingStrategy;
use App\Strategies\Pricing\VolumePricingStrategy;

class DirectClientOrderFactory extends OrderFactory
{
    public function createOrder(User $user, array $data): Order
    {
        return new Order([
            'order_number'     => $this->generateOrderNumber(),
            'user_id'          => $user->id,
            'company_id'       => $user->company_id,
            'type'             => 'direct',
            'status'           => 'pending',
            'pricing_strategy' => $this->pricingStrategy()->name(),
            'notes'            => $data['notes'] ?? null,
        ]);
    }

    public function pricingStrategy(): PricingStrategy
    {
        // Use volume pricing for direct clients who order large quantities
        return new VolumePricingStrategy;
    }
}
