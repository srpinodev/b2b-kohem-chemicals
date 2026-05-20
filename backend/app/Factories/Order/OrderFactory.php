<?php

namespace App\Factories\Order;

use App\Models\Company;
use App\Models\Order;
use App\Models\User;
use App\Strategies\Pricing\PricingStrategy;

abstract class OrderFactory
{
    abstract public function createOrder(User $user, array $data): Order;

    abstract public function pricingStrategy(): PricingStrategy;

    /**
     * Factory Method: returns the concrete factory for the given company/user context.
     */
    public static function forCustomer(User $user): static
    {
        $company = $user->company;

        if ($company instanceof Company && $company->is_distributor) {
            return new DistributorOrderFactory;
        }

        return new DirectClientOrderFactory;
    }

    protected function generateOrderNumber(): string
    {
        return 'ORD-'.strtoupper(substr(uniqid(), -6)).'-'.date('ymd');
    }
}
