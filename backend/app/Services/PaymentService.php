<?php

namespace App\Services;

use App\Adapters\Payment\PaymentGateway;
use App\Adapters\Payment\WebhookResult;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

class PaymentService
{
    public function __construct(
        private readonly PaymentGateway $gateway,
        private readonly InvoiceService $invoiceService,
    ) {}

    public function initiateCheckout(Order $order, string $successUrl, string $cancelUrl): Transaction
    {
        return DB::transaction(function () use ($order, $successUrl, $cancelUrl) {
            $invoice = Invoice::where('order_id', $order->id)
                ->whereIn('status', ['draft', 'issued'])
                ->first();

            if (! $invoice) {
                $invoice = $this->invoiceService->createFromOrder($order);
            }

            $result = $this->gateway->createCheckoutSession($invoice, $successUrl, $cancelUrl);

            return Transaction::create([
                'order_id'    => $order->id,
                'invoice_id'  => $invoice->id,
                'gateway'     => $this->gateway->name(),
                'gateway_id'  => $result->gatewayId,
                'status'      => 'pending',
                'amount'      => $invoice->total,
                'currency'    => 'COP',
                'checkout_url' => $result->checkoutUrl,
            ]);
        });
    }

    public function handleWebhook(string $payload, string $signature): ?Transaction
    {
        $result = $this->gateway->parseWebhook($payload, $signature);

        if (! $result) {
            return null;
        }

        return DB::transaction(fn () => $this->applyWebhookResult($result));
    }

    private function applyWebhookResult(WebhookResult $result): ?Transaction
    {
    $transaction = Transaction::where('gateway_id', $result->gatewayId)->first();

        if (! $transaction) {
            return null;
        }

        $transaction->update([
            'status'           => $result->status,
            'gateway_response' => $result->raw,
        ]);

        if ($result->status === 'succeeded') {
            $invoice = Invoice::find($transaction->invoice_id);
            $invoice->update(['status' => 'paid']);

            // Actualiza la orden a processing
            $order = Order::find($transaction->order_id);
            if ($order && $order->canTransitionTo('processing')) {
                $order->update(['status' => 'processing']);
            }

            // Regenera el PDF con estado 'paid' actualizado
            $this->invoiceService->generatePdf($invoice->fresh());
        }

        return $transaction->fresh();
    }
}
