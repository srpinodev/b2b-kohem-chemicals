<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Código de verificación de un solo uso (OTP) enviado por correo justo antes
 * de procesar el pago. Vive solo en Redis con TTL corto — nunca se persiste.
 */
class PaymentVerificationCodeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Order $order,
        private readonly string $code,
        private readonly int $ttlMinutes,
    ) {
        $this->onQueue('emails');
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Código de verificación de pago — Pedido {$this->order->order_number}")
            ->greeting("Hola {$notifiable->name},")
            ->line("Estás a punto de pagar el pedido **{$this->order->order_number}**.")
            ->line("Tu código de verificación es:")
            ->line("# {$this->code}")
            ->line("El código vence en {$this->ttlMinutes} minutos. No lo compartas con nadie.")
            ->line('Si no fuiste tú quien intentó pagar este pedido, contacta soporte de inmediato.');
    }
}
