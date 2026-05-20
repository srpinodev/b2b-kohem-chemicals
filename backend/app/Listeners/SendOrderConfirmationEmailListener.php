<?php

namespace App\Listeners;

use App\Adapters\Email\EmailGateway;
use App\Events\OrderConfirmed;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendOrderConfirmationEmailListener implements ShouldQueue
{
    public string $queue = 'emails';

    public function __construct(private readonly EmailGateway $email) {}

    public function handle(OrderConfirmed $event): void
    {
        $order = $event->order->loadMissing(['user', 'items']);
        $user  = $order->user;

        if (! $user?->email) {
            return;
        }

        $this->email->send(
            to: [$user->email],
            subject: "Pedido {$order->order_number} confirmado — Kohem Chemicals",
            template: 'order_confirmed',
            data: [
                'userName'    => $user->name,
                'orderNumber' => $order->order_number,
                'date'        => now()->format('d/m/Y'),
                'itemCount'   => $order->items->count(),
                'total'       => (float) $order->total,
            ],
        );
    }
}
