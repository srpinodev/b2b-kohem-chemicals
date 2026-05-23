<?php

namespace App\Adapters\Payment;

use App\Models\Invoice;
use Illuminate\Support\Str;

/**
 * Adapter de pasarela de pagos para demo local — se activa cuando STRIPE_SECRET
 * está vacío o es el placeholder por defecto. NO importa el SDK de Stripe; sigue
 * cumpliendo el puerto PaymentGateway (Adapter pattern) y la regla del CLAUDE.md.
 *
 * Genera un checkout_url que apunta a una ruta del propio backend que marca la
 * transacción como pagada y redirige al success_url del frontend — así el flujo
 * completo (pago → factura pagada → PaymentReturnPage) funciona sin Stripe real.
 */
class FakeStripeAdapter implements PaymentGateway
{
    public function createCheckoutSession(Invoice $invoice, string $successUrl, string $cancelUrl): CheckoutResult
    {
        $gatewayId = 'fake_'.Str::random(24);

        $checkoutUrl = url('/api/payments/fake/complete').'?'.http_build_query([
            'gateway_id'  => $gatewayId,
            'success_url' => $successUrl,
            'cancel_url'  => $cancelUrl,
        ]);

        return new CheckoutResult(
            gatewayId:   $gatewayId,
            checkoutUrl: $checkoutUrl,
        );
    }

    public function parseWebhook(string $payload, string $signature): ?WebhookResult
    {
        // Webhook simulado: payload JSON con { gateway_id, status }
        $data = json_decode($payload, true);
        if (! is_array($data) || empty($data['gateway_id'])) {
            return null;
        }

        return new WebhookResult(
            gatewayId: (string) $data['gateway_id'],
            status:    $data['status'] ?? 'succeeded',
            raw:       $data,
        );
    }

    public function name(): string
    {
        return 'stripe_fake';
    }
}
