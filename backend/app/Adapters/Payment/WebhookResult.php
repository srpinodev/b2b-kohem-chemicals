<?php

namespace App\Adapters\Payment;

final class WebhookResult
{
    public function __construct(
        public readonly string $gatewayId,
        public readonly string $status, // succeeded | failed | refunded
        public readonly array $raw = [],
    ) {}
}
