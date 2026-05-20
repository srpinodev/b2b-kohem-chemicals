<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Notifications\Notification;

class InvoiceReadyNotification extends Notification
{
    public function __construct(private readonly Invoice $invoice) {}

    public function via(object $notifiable): array
    {
        return ['database'];
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
}
