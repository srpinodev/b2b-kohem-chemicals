<?php

namespace App\Listeners;

use App\Events\OrderConfirmed;
use App\Services\InvoiceService;
use Illuminate\Contracts\Queue\ShouldQueue;

class GenerateInvoiceListener implements ShouldQueue
{
    public string $queue = 'invoices';

    public function __construct(private readonly InvoiceService $invoiceService) {}

    public function handle(OrderConfirmed $event): void
    {
        $invoice = $this->invoiceService->createFromOrder($event->order);
        $this->invoiceService->generatePdf($invoice);
    }
}
