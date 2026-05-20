<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 14px; color: #333; background: #f5f5f5; margin: 0; padding: 20px; }
  .card { background: white; border-radius: 8px; padding: 32px; max-width: 560px; margin: 0 auto; }
  h2 { color: #1e40af; margin-top: 0; }
  .label { color: #888; font-size: 12px; text-transform: uppercase; }
  .value { font-weight: bold; font-size: 15px; margin-bottom: 12px; }
  .total { background: #1e40af; color: white; padding: 12px 16px; border-radius: 6px; font-size: 16px; font-weight: bold; }
  .footer { margin-top: 24px; font-size: 11px; color: #aaa; text-align: center; }
</style>
</head>
<body>
<div class="card">
  <h2>Pedido Confirmado — Kohem Chemicals</h2>
  <p>Hola <strong>{{ $userName }}</strong>, tu pedido ha sido confirmado.</p>
  <div class="label">Número de pedido</div>
  <div class="value">{{ $orderNumber }}</div>
  <div class="label">Fecha</div>
  <div class="value">{{ $date }}</div>
  <div class="label">Productos</div>
  <div class="value">{{ $itemCount }} ítem(s)</div>
  <div class="total">Total: ${{ number_format($total, 0, ',', '.') }} COP</div>
  <p style="margin-top:20px">En breve recibirás la factura en este mismo correo. Si tienes dudas, contacta a tu asesor.</p>
</div>
<div class="footer">Kohem Chemicals — Plataforma B2B · Colombia</div>
</body>
</html>
