# ADR-003: Stripe como pasarela de pago (patrón Adapter)

**Estado:** Aceptado  
**Fecha:** 2026-05-20

## Contexto

El sistema necesita procesar pagos de pedidos B2B en Colombia (moneda COP). Se requiere un tier gratuito para el MVP y la posibilidad de cambiar de pasarela sin reescribir lógica de negocio.

## Decisión

- **Stripe Test Mode** en modo sandbox (sin cobros reales)
- Interfaz `PaymentGateway` propia con dos métodos: `createCheckoutSession()` y `parseWebhook()`
- `StripeAdapter` implementa la interfaz adaptando el SDK `stripe/stripe-php`
- El binding `PaymentGateway → StripeAdapter` se configura en `AppServiceProvider`

## Consecuencias

**Positivas:**
- Añadir PayU requiere sólo `PayUAdapter implements PaymentGateway` + cambiar el binding — cero cambios en `PaymentService` o controllers
- Los tests mockean `PaymentGateway` sin necesidad de credenciales Stripe reales
- Stripe Checkout hosted maneja PCI compliance sin almacenar datos de tarjeta

**Negativas:**
- Stripe no tiene oficina en Colombia — para producción real se evalúa PayU (que sí está regulado por la SFC)
- Los webhooks de Stripe requieren HTTPS en producción; en local se usa Stripe CLI para tunnel

## Alternativas consideradas

- **PayU Sandbox:** más usado en Colombia, pero su DX de integración es más compleja y el sandbox requiere aprobación de cuenta
- **MercadoPago:** viable pero menos usado en B2B químico
