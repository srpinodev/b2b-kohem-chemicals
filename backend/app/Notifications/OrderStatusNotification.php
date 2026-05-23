<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Order $order,
        private readonly string $fromStatus,
        private readonly string $toStatus,
    ) {
        $this->onQueue('emails');
    }

    /** Para el primer salto pending→confirmed ya existe SendOrderConfirmationEmailListener,
     *  así que evitamos duplicar el correo. El resto sí lo enviamos por mail+database. */
    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if ($this->toStatus !== 'confirmed') {
            $channels[] = 'mail';
        }

        return $channels;
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

    public function toMail(object $notifiable): MailMessage
    {
        $label   = $this->statusLabel();
        $message = "Tu pedido {$this->order->order_number} ha sido {$label}.";

        return (new MailMessage)
            ->subject("Pedido {$this->order->order_number} — {$label}")
            ->greeting("Hola {$notifiable->name},")
            ->line($message)
            ->action('Ver pedido', url("/orders/{$this->order->id}"))
            ->line('Gracias por confiar en Kohem Chemicals.');
    }

    private function buildMessage(): string
    {
        return "Tu pedido {$this->order->order_number} ha sido {$this->statusLabel()}.";
    }

    private function statusLabel(): string
    {
        return match ($this->toStatus) {
            'confirmed'  => 'confirmado',
            'processing' => 'en proceso',
            'shipped'    => 'enviado',
            'delivered'  => 'entregado',
            'cancelled'  => 'cancelado',
            default      => $this->toStatus,
        };
    }
}
