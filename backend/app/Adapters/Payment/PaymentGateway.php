<?php

namespace App\Adapters\Payment;

use App\Models\Invoice;
use App\Models\Transaction;

interface PaymentGateway
{
    /**
     * Create a checkout session and return the redirect URL + gateway transaction ID.
     */
    public function createCheckoutSession(Invoice $invoice, string $successUrl, string $cancelUrl): CheckoutResult;

    /**
     * Verify and parse an incoming webhook payload.
     * Returns the gateway transaction ID and new status, or null if irrelevant event.
     */
    public function parseWebhook(string $payload, string $signature): ?WebhookResult;

    public function name(): string;
}
