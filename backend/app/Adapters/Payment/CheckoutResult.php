<?php

namespace App\Adapters\Payment;

final class CheckoutResult
{
    public function __construct(
        public readonly string $gatewayId,
        public readonly string $checkoutUrl,
    ) {}
}
