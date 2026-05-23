<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class InvoiceService
{
    private const TAX_RATE = 0.19; // IVA Colombia 19%

    public function createFromOrder(Order $order, string $type = 'invoice'): Invoice
    {
        $order->loadMissing(['items.product', 'company', 'user']);

        // Resuelve company_id: orden → usuario → falla explícita
        $companyId = $order->company_id
        ?? $order->user?->company_id
        ?? throw new \RuntimeException(
            "La orden #{$order->order_number} no tiene empresa asignada. ".
            "Asegúrate de que el usuario o la orden tengan company_id."
        );

        $subtotal = (float) $order->subtotal;
        $taxAmount = round($subtotal * self::TAX_RATE, 2);
        $total = round($subtotal + $taxAmount, 2);

        return Invoice::create([
            'order_id'       => $order->id,
            'company_id'     => $order->company_id,
            'invoice_number' => $this->nextInvoiceNumber($type),
            'type'           => $type,
            'status'         => 'issued',
            'subtotal'       => $subtotal,
            'tax_rate'       => self::TAX_RATE,
            'tax_amount'     => $taxAmount,
            'total'          => $total,
            'issued_at'      => now()->toDateString(),
            'due_date'       => now()->addDays(30)->toDateString(),
        ]);
    }

    public function generatePdf(Invoice $invoice): string
    {
        $invoice->loadMissing(['order.items.product', 'order.company', 'company']);

        $pdf = Pdf::loadView('invoices.pdf', ['invoice' => $invoice]);

        $filename = 'invoices/'.$invoice->invoice_number.'.pdf';
        Storage::put($filename, $pdf->output());

        $invoice->update(['pdf_path' => $filename]);

        return $filename;
    }

    public function getPdfPath(Invoice $invoice): string
    {
        if ($invoice->pdf_path && Storage::exists($invoice->pdf_path)) {
            return $invoice->pdf_path;
        }

        return $this->generatePdf($invoice);
    }

    private function nextInvoiceNumber(string $type): string
    {
        $prefix = match ($type) {
            'proforma'    => 'PRO',
            'credit_note' => 'NC',
            default       => 'FAC',
        };

        $last = Invoice::where('type', $type)
            ->where('invoice_number', 'like', $prefix.'-%')
            ->max('invoice_number');

        $seq = $last ? ((int) substr($last, strlen($prefix) + 1)) + 1 : 1;

        return $prefix.'-'.str_pad((string) $seq, 6, '0', STR_PAD_LEFT);
    }
}
