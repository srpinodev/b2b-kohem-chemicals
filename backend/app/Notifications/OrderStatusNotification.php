<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Notifications\Notification;

class OrderStatusNotification extends Notification
{
    public function __construct(
        private readonly Order $order,
        private readonly string $fromStatus,
        private readonly string $toStatus,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'order_id'     => $this->order->id,
            'order_number' => $this->order->order_number,
            'from_status'  => $this->fromStatus,
            'to_status'    => $this->toStatus,
            'message'      => $this->buildMessage(),
        ];
    }

    private function buildMessage(): string
    {
        $labels = [
            'confirmed'  => 'confirmado',
            'processing' => 'en proceso',
            'shipped'    => 'enviado',
            'delivered'  => 'entregado',
            'cancelled'  => 'cancelado',
        ];

        $label = $labels[$this->toStatus] ?? $this->toStatus;

        return "Tu pedido {$this->order->order_number} ha sido {$label}.";
    }
}
