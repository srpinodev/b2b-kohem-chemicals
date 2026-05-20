<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #333; margin: 0; padding: 20px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #1e40af; padding-bottom: 15px; }
        .company-name { font-size: 22px; font-weight: bold; color: #1e40af; }
        .invoice-title { text-align: right; }
        .invoice-title h1 { font-size: 20px; color: #1e40af; margin: 0; }
        .invoice-title p { margin: 2px 0; color: #666; }
        .parties { display: flex; justify-content: space-between; margin-bottom: 25px; }
        .party-block { width: 48%; }
        .party-block h3 { font-size: 11px; text-transform: uppercase; color: #888; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 8px; }
        .party-block p { margin: 3px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        thead tr { background: #1e40af; color: white; }
        thead th { padding: 8px 10px; text-align: left; font-size: 11px; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        tbody td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
        .text-right { text-align: right; }
        .totals { float: right; width: 280px; }
        .totals table { margin: 0; }
        .totals td { padding: 5px 10px; }
        .totals .grand-total td { font-weight: bold; font-size: 14px; background: #1e40af; color: white; }
        .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 10px; font-size: 10px; color: #999; text-align: center; }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; }
        .badge-paid { background: #d1fae5; color: #065f46; }
        .badge-issued { background: #dbeafe; color: #1e40af; }
        .badge-draft { background: #f3f4f6; color: #6b7280; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="company-name">Kohem Chemicals</div>
            <p>NIT: 900.XXX.XXX-X</p>
            <p>Colombia</p>
        </div>
        <div class="invoice-title">
            <h1>
                @if($invoice->type === 'proforma') FACTURA PROFORMA
                @elseif($invoice->type === 'credit_note') NOTA CRÉDITO
                @else FACTURA DE VENTA
                @endif
            </h1>
            <p><strong>{{ $invoice->invoice_number }}</strong></p>
            <p>Emisión: {{ $invoice->issued_at?->format('d/m/Y') }}</p>
            <p>Vencimiento: {{ $invoice->due_date?->format('d/m/Y') }}</p>
            <p><span class="badge badge-{{ $invoice->status }}">{{ strtoupper($invoice->status) }}</span></p>
        </div>
    </div>

    <div class="parties">
        <div class="party-block">
            <h3>Vendedor</h3>
            <p><strong>Kohem Chemicals S.A.S</strong></p>
            <p>Régimen Común — Responsable de IVA</p>
        </div>
        <div class="party-block">
            <h3>Cliente</h3>
            <p><strong>{{ $invoice->company->name }}</strong></p>
            <p>NIT: {{ $invoice->company->nit }}</p>
            @if($invoice->order?->user)
            <p>Contacto: {{ $invoice->order->user->name }}</p>
            @endif
        </div>
    </div>

    <p style="margin-bottom:8px"><strong>Pedido:</strong> {{ $invoice->order->order_number }}</p>

    <table>
        <thead>
            <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th class="text-right">Cantidad</th>
                <th class="text-right">Precio unit.</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice->order->items as $item)
            <tr>
                <td>{{ $item->product->sku }}</td>
                <td>{{ $item->product->name }}</td>
                <td class="text-right">{{ number_format($item->quantity, 0) }} {{ $item->product->unit }}</td>
                <td class="text-right">$ {{ number_format($item->unit_price, 2, ',', '.') }}</td>
                <td class="text-right">$ {{ number_format($item->line_total, 2, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <table>
            <tr>
                <td>Subtotal</td>
                <td class="text-right">$ {{ number_format($invoice->subtotal, 2, ',', '.') }}</td>
            </tr>
            <tr>
                <td>IVA ({{ number_format($invoice->tax_rate * 100, 0) }}%)</td>
                <td class="text-right">$ {{ number_format($invoice->tax_amount, 2, ',', '.') }}</td>
            </tr>
            <tr class="grand-total">
                <td>TOTAL COP</td>
                <td class="text-right">$ {{ number_format($invoice->total, 2, ',', '.') }}</td>
            </tr>
        </table>
    </div>

    <div style="clear:both"></div>

    <div class="footer">
        <p>Kohem Chemicals — Plataforma B2B de Productos Químicos — Colombia</p>
        <p>Este documento fue generado electrónicamente y no requiere firma física.</p>
    </div>
</body>
</html>
