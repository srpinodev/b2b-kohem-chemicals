<?php

namespace App\Listeners;

use App\Adapters\Email\EmailGateway;
use App\Events\OrderConfirmed;
use App\Services\InvoiceService;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;

class GenerateInvoiceListener implements ShouldQueue
{
    public string $queue = 'invoices';

    public function __construct(
        private readonly InvoiceService $invoiceService,
        private readonly NotificationService $notificationService,
        private readonly EmailGateway $email,
    ) {}

    public function handle(OrderConfirmed $event): void
    {
        $order   = $event->order->loadMissing(['user', 'items.product', 'company']);
        $invoice = $this->invoiceService->createFromOrder($order);
        $this->invoiceService->generatePdf($invoice);

        $this->notificationService->notifyInvoiceReady($invoice);

        $user = $order->user;
        if ($user?->email) {
            $this->email->send(
                to: [$user->email],
                subject: "Factura {$invoice->invoice_number} disponible — Kohem Chemicals",
                template: 'invoice_ready',
                data: [
                    'userName'      => $user->name,
                    'invoiceNumber' => $invoice->invoice_number,
                    'orderNumber'   => $order->order_number,
                    'total'         => (float) $invoice->total,
                ],
            );
        }
    }
}
