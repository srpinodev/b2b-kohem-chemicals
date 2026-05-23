<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckoutRequest;
use App\Models\Order;
use App\Services\PaymentService;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(private readonly PaymentService $paymentService) {}

    public function checkout(CheckoutRequest $request, Order $order)
    {
        $user = auth()->user();

        if ($user->hasRole('cliente') && $order->company_id !== $user->company_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (! in_array($order->status, ['confirmed', 'processing'])) {
            return response()->json(['message' => 'Order is not in a payable state.'], 422);
        }

        $transaction = $this->paymentService->initiateCheckout(
            $order,
            $request->input('success_url'),
            $request->input('cancel_url'),
        );

        return response()->json([
            'transaction'  => $transaction,
            'checkout_url' => $transaction->checkout_url,
        ], 201);
    }

    public function webhook(Request $request)
    {
        $payload   = $request->getContent();
        $signature = $request->header('Stripe-Signature', '');

        try {
            $transaction = $this->paymentService->handleWebhook($payload, $signature);
        } catch (\RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }

        return response()->json(['received' => true, 'processed' => $transaction !== null]);
    }

    /**
     * Endpoint de la "pasarela" simulada — invocado cuando FakeStripeAdapter está activo.
     * Marca la transacción como pagada y redirige al success_url del frontend.
     */
    public function fakeComplete(Request $request)
    {
        $gatewayId  = (string) $request->query('gateway_id');
        $successUrl = (string) $request->query('success_url');

        if ($gatewayId === '' || $successUrl === '') {
            return response()->json(['message' => 'Missing parameters'], 400);
        }

        // Reutilizamos el flujo de webhook real: simulamos el payload firmado.
        $this->paymentService->handleWebhook(
            json_encode(['gateway_id' => $gatewayId, 'status' => 'succeeded']),
            'fake-signature',
        );

        return redirect()->away($successUrl);
    }
}
