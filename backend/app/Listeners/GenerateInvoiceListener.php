<?php

namespace App\Listeners;

use App\Events\OrderConfirmed;
use Illuminate\Contracts\Queue\ShouldQueue;

class GenerateInvoiceListener implements ShouldQueue
{
    public string $queue = 'invoices';

    public function handle(OrderConfirmed $event): void
    {
        // Sprint 4: generate invoice PDF via InvoiceService
        \Log::info('Invoice generation queued', ['order' => $event->order->order_number]);
    }
}
