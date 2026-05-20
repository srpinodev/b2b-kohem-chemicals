<?php

namespace App\Adapters\Payment;

use App\Models\Invoice;
use Stripe\Exception\SignatureVerificationException;
use Stripe\StripeClient;
use Stripe\Webhook;

class StripeAdapter implements PaymentGateway
{
    private ?StripeClient $stripe = null;

    private function client(): StripeClient
    {
        return $this->stripe ??= new StripeClient(config('services.stripe.secret'));
    }

    public function createCheckoutSession(Invoice $invoice, string $successUrl, string $cancelUrl): CheckoutResult
    {
        // Convert COP to cents — Stripe requires integer amount
        $amountCents = (int) round((float) $invoice->total * 100);

        $session = $this->client()->checkout->sessions->create([
            'payment_method_types' => ['card'],
            'line_items' => [[
                'price_data' => [
                    'currency'     => 'cop',
                    'unit_amount'  => $amountCents,
                    'product_data' => [
                        'name' => 'Pedido '.$invoice->order->order_number,
                    ],
                ],
                'quantity' => 1,
            ]],
            'mode'        => 'payment',
            'success_url' => $successUrl.'?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url'  => $cancelUrl,
            'metadata'    => [
                'invoice_id' => $invoice->id,
                'order_id'   => $invoice->order_id,
            ],
        ]);

        return new CheckoutResult(
            gatewayId:   $session->id,
            checkoutUrl: $session->url,
        );
    }

    public function parseWebhook(string $payload, string $signature): ?WebhookResult
    {
        try {
            $event = Webhook::constructEvent(
                $payload,
                $signature,
                config('services.stripe.webhook_secret')
            );
        } catch (SignatureVerificationException) {
            throw new \RuntimeException('Webhook signature verification failed.');
        }

        return match ($event->type) {
            'checkout.session.completed' => new WebhookResult(
                gatewayId: $event->data->object->id,
                status:    'succeeded',
                raw:       $event->data->object->toArray(),
            ),
            'checkout.session.expired',
            'payment_intent.payment_failed' => new WebhookResult(
                gatewayId: $event->data->object->id,
                status:    'failed',
                raw:       $event->data->object->toArray(),
            ),
            default => null,
        };
    }

    public function name(): string
    {
        return 'stripe';
    }
}
