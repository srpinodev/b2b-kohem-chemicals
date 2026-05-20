<?php

namespace App\Listeners;

use App\Events\OrderConfirmed;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendOrderConfirmationEmailListener implements ShouldQueue
{
    public string $queue = 'emails';

    public function handle(OrderConfirmed $event): void
    {
        // Sprint 5: send confirmation email via EmailProviderAdapter
        // Queued so it does not block the HTTP response
        \Log::info('Order confirmation email queued', ['order' => $event->order->order_number]);
    }
}
