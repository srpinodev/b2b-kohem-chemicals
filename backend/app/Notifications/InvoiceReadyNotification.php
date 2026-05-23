<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InvoiceReadyNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly Invoice $invoice)
    {
        $this->onQueue('emails');
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'invoice_id'     => $this->invoice->id,
            'invoice_number' => $this->invoice->invoice_number,
            'order_number'   => $this->invoice->order->order_number ?? null,
            'total'          => $this->invoice->total,
            'message'        => "Tu factura {$this->invoice->invoice_number} está disponible para descarga.",
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Factura {$this->invoice->invoice_number} — Kohem Chemicals")
            ->greeting("Hola {$notifiable->name},")
            ->line("Tu factura {$this->invoice->invoice_number} está lista.")
            ->line('Total: $'.number_format((float) $this->invoice->total, 0, ',', '.').' COP')
            ->action('Ver facturas', url('/invoices'))
            ->line('Gracias por tu compra.');
    }
}
