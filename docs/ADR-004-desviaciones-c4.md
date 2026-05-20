# ADR-004: Desviaciones justificadas entre el diagrama C4 y la implementación

**Estado:** Aceptado  
**Fecha:** 2026-05-20  
**Autores:** Equipo Kohem Chemicals B2B  
**Referencia:** Diagrama C4 Nivel Código — PlantUML original en `Evaluación 5.docx`

---

## Contexto

El diagrama C4 de nivel código (clases) fue diseñado durante la fase de arquitectura antes de iniciar el desarrollo. Al implementar el sistema sobre Laravel 11, Stripe Checkout y Eloquent ORM, surgieron cinco puntos de desviación respecto al diseño original. Este ADR los documenta, justifica y confirma que ninguno compromete la presencia ni la intención de los cinco patrones GoF comprometidos.

---

## Desviaciones

### D-1 — `Order` como modelo único en lugar de jerarquía de herencia

**Diseño original:** `Order` (abstracta) con subclases `DirectClientOrder` y `DistributorOrder`.

**Implementación:** Un único modelo Eloquent `Order` con columna `type: enum('direct', 'distributor')`. La diferenciación de comportamiento la realiza la Factory Method, no la herencia del modelo.

**Justificación:** Eloquent ORM no soporta herencia de tabla única (`STI`) de forma nativa en Laravel 11. Implementarla manualmente requeriría sobreescribir el query builder y la hidratación del modelo, añadiendo complejidad accidental sin beneficio funcional. El patrón Factory Method sigue vigente: `OrderFactory::forCustomer()` selecciona `DirectClientOrderFactory` o `DistributorOrderFactory`, cada una responsable de inicializar el pedido con sus particularidades (estrategia de pricing, tipo). La distinción de tipos queda registrada en la columna `type` y en `pricing_strategy`.

**Patrón afectado:** Factory Method — **no comprometido**.

---

### D-2 — Firma del método `PricingStrategy::calculatePrice()`

**Diseño original:** `calculatePrice(order: Order): Decimal` — recibe el pedido completo.

**Implementación:** `calculateUnitPrice(Product $product, int $quantity): float` — recibe producto y cantidad.

**Justificación:** Calcular el precio a nivel de ítem es más preciso: permite que una misma orden aplique estrategias distintas por producto (ej. precio de lista para unos ítems y precio por volumen para otros). Recibir el `Order` completo en este momento del ciclo de vida es imposible porque la estrategia se invoca *durante* la construcción del pedido, antes de que exista el objeto `Order` persistido. La interfaz `PricingStrategy` y sus tres implementaciones (`ListPricingStrategy`, `DistributorPricingStrategy`, `VolumePricingStrategy`) permanecen inalteradas en estructura.

**Patrón afectado:** Strategy — **no comprometido**.

---

### D-3 — `OrderEventPublisher` e `OrderEventListener` reemplazados por el sistema de eventos de Laravel

**Diseño original:** Clase explícita `OrderEventPublisher` con lista de `OrderEventListener`; interfaz `OrderEventListener` con métodos `handle()` y `getListenerType()`.

**Implementación:** Se usa `Event::listen()` de Laravel registrado en `AppServiceProvider`. Los eventos `OrderConfirmed` y `OrderStatusChanged` son clases POPO; los listeners implementan `ShouldQueue` para procesamiento asíncrono.

**Justificación:** El sistema de eventos de Laravel es exactamente el patrón Observer con soporte nativo de cola, reintentos, prioridad y serialización. Reimplementar `OrderEventPublisher` encima de él sería duplicar infraestructura. El método `getListenerType()` no se implementó porque Laravel identifica los listeners por nombre de clase, que cumple el mismo propósito. Se añadió además el evento `OrderStatusChanged` (no presente en el diagrama original) para registrar trazabilidad en cada transición de estado, no solo en la confirmación.

**Patrón afectado:** Observer — **no comprometido**.

---

### D-4 — `PaymentGateway`: métodos `charge()/refund()` → `createCheckoutSession()/parseWebhook()`

**Diseño original:** `PaymentGateway` con `charge(amount): PaymentResult` y `refund(txnId): boolean`. `ExternalPaymentAdapter` + `ExternalPaymentClient` como clases separadas. `CheckoutFacade` orquestando el flujo.

**Implementación:** `PaymentGateway` con `createCheckoutSession(Invoice, successUrl, cancelUrl): CheckoutResult` y `parseWebhook(payload, signature): ?WebhookResult`. `StripeAdapter` encapsula el SDK. `PaymentService` reemplaza a `CheckoutFacade`.

**Justificación:** Stripe en modo test (y en producción) opera con flujo *hosted checkout*: el cliente es redirigido a una página de Stripe, no se procesa el pago mediante una llamada directa `charge()` desde el servidor. Un `charge()` directo requeriría capturar y transmitir datos de tarjeta (fuera del alcance PCI de este MVP). Los métodos `createCheckoutSession()` y `parseWebhook()` son la representación correcta de este flujo. El patrón Adapter sigue intacto: `StripeAdapter` adapta el SDK de Stripe (`stripe/stripe-php`) a la interfaz propia `PaymentGateway`; ningún Service ni Controller importa el SDK directamente. `ExternalPaymentClient` se consolidó dentro de `StripeAdapter` (lazy-initialized) porque el SDK ya provee esa capa. `PaymentService` cumple el rol de `CheckoutFacade`.

**Patrón afectado:** Adapter — **no comprometido**.

---

### D-5 — `CachedProductSourceProxy`: métodos de interfaz y ausencia de `AuditLogger` y `CacheService` propios

**Diseño original:** `ProductSource` con `findById()`, `findAll()`, `checkStock()`. `CacheService` como clase propia. `AuditLogger` dentro del Proxy.

**Implementación:** `ProductSource` con `paginate(filters, perPage)`, `findBySku(sku)`, `create()`, `update()`, `delete()`. `Cache::tags()` de Laravel reemplaza a `CacheService`. No existe `AuditLogger` en el Proxy; la trazabilidad la gestiona `LogTraceabilityListener`.

**Justificación:** El contrato de la interfaz se ajustó a los casos de uso reales: el catálogo se consume en listados paginados con filtros (no como `findAll()` sin límite) y por SKU (no por UUID interno). Añadir `checkStock()` habría duplicado la lógica de `UpdateInventoryListener`. Laravel's `Cache::tags(['products'])->flush()` ofrece invalidación atómica por tag sin necesidad de una clase `CacheService` wrapper. El `AuditLogger` del diagrama se reemplazó con `order_state_logs` + `LogTraceabilityListener`, que es el mecanismo de trazabilidad unificado del sistema; duplicarlo en el Proxy habría generado dos fuentes de verdad para auditoría.

**Patrón afectado:** Proxy — **no comprometido**.

---

## Conclusión

Todas las desviaciones son consecuencia de adaptar el diseño teórico a las restricciones y convenciones del stack real (Laravel 11, Stripe Checkout, Eloquent). Los cinco patrones GoF comprometidos en la Evaluación 5 están presentes, verificables en código y cubiertos por tests automatizados. Ninguna desviación elimina ni degrada la intención arquitectónica original.

| Patrón | Desviación(es) | Estado final |
|---|---|---|
| Factory Method | D-1 (sin herencia de modelo) | ✅ Implementado |
| Strategy | D-2 (firma del método) | ✅ Implementado |
| Observer | D-3 (sin EventPublisher/Listener propios) | ✅ Implementado |
| Adapter | D-4 (métodos y clases adaptados a Stripe Checkout) | ✅ Implementado |
| Proxy | D-5 (métodos de interfaz y helpers de Laravel) | ✅ Implementado |
