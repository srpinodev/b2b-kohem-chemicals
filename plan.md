# Plan de desarrollo â€” Kohem Chemicals B2B (MVP 12 semanas)

## Context

El equipo de Kohem Chemicals (3 personas, ~12 semanas) construirÃ¡ una plataforma B2B web para automatizar la venta de productos quÃ­micos en Colombia, reemplazando los canales tradicionales (llamadas, emails, visitas) por un canal digital centralizado. La arquitectura ya estÃ¡ definida y documentada en la EvaluaciÃ³n 5 mediante el modelo C4:

- **Estilo:** Layered Architecture sobre REST API
- **Frontend (PresentaciÃ³n):** React 18 + TypeScript + Vite
- **Backend (API + Negocio):** PHP 8.2 + Laravel 11
- **Persistencia:** MySQL 8.0 con Eloquent ORM (Repository pattern)
- **CachÃ©/Cola:** Redis 7 (sesiones, JWT blacklist, catÃ¡logo cacheado, Laravel Queue)
- **Integraciones externas:** Stripe **o** PayU (la que ofrezca tier gratuito accesible), proveedor de email transaccional gratuito (Brevo/Mailtrap/Mailgun a confirmar), chatbot open-source

Este plan operativiza esos diagramas C1â€“C4 en sprints ejecutables, asegurando que los **5 patrones GoF** comprometidos (Factory Method, Strategy, Observer, Adapter, Proxy) se materialicen como cÃ³digo real y que los **atributos de calidad** prometidos (seguridad, disponibilidad, rendimiento, mantenibilidad, trazabilidad) tengan implementaciÃ³n verificable. El entregable final es un **sistema funcional ejecutable en local** vÃ­a `docker-compose up` con seeders de demo, sin despliegue pÃºblico.

## Estructura del repositorio (monorepo)

```
B2B Kohem Chemicals/
â”œâ”€â”€ backend/                    # Laravel 11 (API REST)
â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”œâ”€â”€ Models/             # Eloquent models
â”‚   â”‚   â”œâ”€â”€ Http/Controllers/Api/
â”‚   â”‚   â”œâ”€â”€ Http/Middleware/    # JWT, 2FA, RBAC
â”‚   â”‚   â”œâ”€â”€ Services/           # LÃ³gica de negocio (capa servicio C3)
â”‚   â”‚   â”œâ”€â”€ Repositories/       # Capa de datos (Eloquent repository)
â”‚   â”‚   â”œâ”€â”€ Factories/Order/    # PatrÃ³n Factory Method
â”‚   â”‚   â”œâ”€â”€ Strategies/Pricing/ # PatrÃ³n Strategy
â”‚   â”‚   â”œâ”€â”€ Events/             # OrderConfirmed, etc.
â”‚   â”‚   â”œâ”€â”€ Listeners/          # PatrÃ³n Observer
â”‚   â”‚   â”œâ”€â”€ Adapters/Payment/   # PatrÃ³n Adapter (Stripe/PayU)
â”‚   â”‚   â”œâ”€â”€ Adapters/Email/     # PatrÃ³n Adapter (email provider)
â”‚   â”‚   â”œâ”€â”€ Adapters/Chatbot/   # PatrÃ³n Adapter (chatbot externo)
â”‚   â”‚   â””â”€â”€ Proxies/            # CachedProductSourceProxy
â”‚   â”œâ”€â”€ database/migrations/
â”‚   â”œâ”€â”€ database/seeders/
â”‚   â”œâ”€â”€ routes/api.php
â”‚   â””â”€â”€ tests/{Unit,Feature}/
â”œâ”€â”€ frontend/                   # React 18 + TypeScript + Vite
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ pages/              # Rutas por rol (cliente, vendedor, admin)
â”‚   â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ hooks/
â”‚   â”‚   â”œâ”€â”€ services/api/       # Cliente HTTP (axios) por dominio
â”‚   â”‚   â”œâ”€â”€ store/              # Estado global (Zustand o Redux Toolkit)
â”‚   â”‚   â””â”€â”€ types/              # Tipos TS compartidos
â”‚   â””â”€â”€ vite.config.ts
â”œâ”€â”€ docker-compose.yml          # MySQL 8 + Redis 7 + Mailpit (dev)
â”œâ”€â”€ docs/                       # Diagramas C4 (.puml), ADRs
â”œâ”€â”€ plan.md                     # Este plan (copia ejecutable)
â””â”€â”€ README.md                   # Instrucciones de arranque
```

## Roadmap por sprint (6 sprints Ã— 2 semanas)

### Sprint 0 â€” Bootstrap (Semana 1)

- `docker-compose.yml` con servicios: `mysql:8`, `redis:7`, `mailpit` (SMTP local para dev)
- `backend/`: `composer create-project laravel/laravel`, configurar `.env` (DB, Redis, queue=redis, cache=redis)
- `frontend/`: `npm create vite@latest -- --template react-ts`, instalar `axios`, `react-router-dom`, `zustand`, `tailwindcss`
- Linters: Laravel Pint (PHP), ESLint + Prettier (TS), pre-commit hook con Husky
- Endpoints `GET /api/health` y pÃ¡gina React de health-check
- `README.md` con pasos de arranque local

**Entregable:** ambos proyectos arrancan, el SPA hace un fetch al health del API y muestra "OK".

### Sprint 1 â€” Auth, Usuarios y RBAC (Semanas 2â€“3)

- Migrations: `users`, `companies`, `roles`, `role_user`, `credit_limits`
- Auth JWT: `tymon/jwt-auth` (o `laravel/sanctum` con tokens personales; decisiÃ³n en kick-off del sprint)
- 2FA TOTP: `pragmarx/google2fa-laravel`
- RBAC: `spatie/laravel-permission` con roles `cliente`, `vendedor`, `administrador`
- Endpoints: `POST /auth/register`, `/auth/login`, `/auth/2fa/verify`, `/auth/logout` (JWT a blacklist en Redis), `GET /me`
- Middleware: `JwtAuth`, `Require2FA`, `RoleGuard`
- Frontend: pantallas Login â†’ 2FA challenge â†’ Dashboard por rol, `ProtectedRoute`, persistencia de token en `httpOnly` cookie + refresh

**Cubre:** atributo de calidad **seguridad** (autenticaciÃ³n robusta, autorizaciÃ³n por roles, blacklist de tokens).

### Sprint 2 â€” CatÃ¡logo + PatrÃ³n Proxy (Semanas 4â€“5)

- Migrations: `products` (sku, name, cas_number, sds_url, unit, price, stock, category_id), `categories`
- Repository: `ProductRepository` (interface) + `EloquentProductRepository`
- **Proxy:** `CachedProductSourceProxy implements ProductSource` envuelve el repo, cachea catÃ¡logo en Redis con TTL configurable e invalida en escrituras de admin/vendedor
- Endpoints: `GET /catalog`, `GET /catalog/{sku}`, `POST/PUT/DELETE /admin/products` (RBAC vendedor/admin)
- Subida de hojas SDS (PDF) a `storage/app/public/sds`
- Frontend: listado con filtros (categorÃ­a, bÃºsqueda por nombre/CAS), detalle de producto, panel admin de productos

**Cubre:** patrÃ³n **Proxy** + atributos **rendimiento** (cachÃ©) y **mantenibilidad** (repository).

### Sprint 3 â€” Pedidos + Factory + Strategy + Observer (Semanas 6â€“7)

- Migrations: `orders`, `order_items`, `order_state_logs`
- **Factory Method:** `OrderFactory` con `DirectClientOrderFactory` y `DistributorOrderFactory`; el controller pide `OrderFactory->forCustomer($company)` y la fÃ¡brica decide el tipo concreto
- **Strategy:** `PricingStrategy` interface + `ListPricingStrategy`, `DistributorPricingStrategy`, `VolumePricingStrategy`; inyectada en `OrderService` vÃ­a contenedor de Laravel
- **Observer:** evento `OrderConfirmed` + listeners `UpdateInventoryListener`, `GenerateInvoiceListener` (stub), `SendOrderConfirmationEmailListener` (stub), `LogTraceabilityListener` â€” registrados en `EventServiceProvider`
- MÃ¡quina de estados: `pending â†’ confirmed â†’ processing â†’ shipped â†’ delivered` (+ `cancelled`)
- Endpoints: `POST /orders`, `GET /orders` (filtrado por rol), `GET /orders/{id}`, `PATCH /orders/{id}/status`
- Frontend: carrito (Zustand), checkout, historial de pedidos, detalle con timeline de estados

**Cubre:** tres patrones GoF + atributo **trazabilidad** (state logs auditables).

### Sprint 4 â€” FacturaciÃ³n + Pagos + PatrÃ³n Adapter (Semanas 8â€“9)

- Migrations: `invoices`, `proformas`, `credit_notes`, `transactions`
- GeneraciÃ³n de PDFs con `barryvdh/laravel-dompdf` (factura, proforma, nota crÃ©dito)
- CÃ¡lculo de impuestos (IVA Colombia 19%) en `InvoiceService`, considerando exenciones por tipo de producto quÃ­mico
- **Adapter:** `PaymentGateway` interface + `StripeAdapter` y/o `PayUAdapter` (se elige el de menor fricciÃ³n para tier gratuito al inicio del sprint); `CheckoutFacade` orquesta el flujo
- Webhooks de confirmaciÃ³n de pago â†’ actualiza `transactions` y dispara `PaymentConfirmed` event
- Endpoints: `GET /invoices/{id}/pdf`, `POST /orders/{id}/checkout`, `POST /webhooks/payment`
- Frontend: descarga de factura, flujo de pago (redirecciÃ³n a pasarela), pÃ¡gina de retorno con estado

**Cubre:** patrÃ³n **Adapter** + riesgo identificado **"exactitud de la facturaciÃ³n"** (tests especÃ­ficos de cÃ¡lculos).

### Sprint 5 â€” Notificaciones + Chatbot + Cola async (Semanas 10â€“11)

- Configurar Laravel Queue con driver Redis; worker corriendo en docker-compose
- **Adapter Email:** `EmailProviderAdapter` interface + implementaciÃ³n segÃºn proveedor elegido (Brevo gratis 300/dÃ­a, Mailtrap sandbox, o Mailgun); en dev se usa Mailpit
- Mover listeners de Sprint 3 (`GenerateInvoice`, `SendOrderConfirmationEmail`) a jobs encolados
- Notificaciones in-app: tabla `notifications` (Laravel notifications), endpoint `GET /notifications`
- **Adapter Chatbot:** integrar opciÃ³n open-source â€” preferencia por **BotPress Community** vÃ­a Docker, o fallback a chatbot FAQ rule-based propio si BotPress aÃ±ade complejidad de despliegue
- Frontend: campana de notificaciones, widget de chat embebido

**Cubre:** patrÃ³n Observer asÃ­ncrono + atributo **disponibilidad** (procesamiento desacoplado).

### Sprint 6 â€” Hardening, trazabilidad y demo (Semana 12)

- AuditorÃ­a de seguridad: rate limiting (`throttle`), CORS, headers (`secure_headers`), validaciÃ³n exhaustiva en FormRequests, escaneo `composer audit` / `npm audit`
- Performance: medir respuesta de catÃ¡logo y creaciÃ³n de pedido contra el SLO **<2s** del documento, optimizar Ã­ndices DB y TTLs de Redis
- Tests E2E con Playwright cubriendo: registro+2FA, navegar catÃ¡logo, crear pedido, pagar (sandbox), recibir notificaciÃ³n
- Seeders de demo: 3 empresas cliente, 10 productos quÃ­micos con CAS reales, 1 vendedor, 1 admin
- DocumentaciÃ³n: README final con `docker-compose up` + credenciales demo, colecciÃ³n Postman/Insomnia exportada, ADRs en `/docs`
- Repaso del C4 vs implementaciÃ³n real, ajustar diagramas si hay deriva

## Mapa patrones GoF â†’ archivos

| PatrÃ³n | UbicaciÃ³n |
|---|---|
| Factory Method | `backend/app/Factories/Order/{OrderFactory,DirectClientOrderFactory,DistributorOrderFactory}.php` |
| Strategy | `backend/app/Strategies/Pricing/{PricingStrategy,ListPricingStrategy,DistributorPricingStrategy,VolumePricingStrategy}.php` |
| Observer | `backend/app/Events/OrderConfirmed.php` + `backend/app/Listeners/*Listener.php` + `EventServiceProvider` |
| Adapter | `backend/app/Adapters/Payment/{PaymentGateway,StripeAdapter,PayUAdapter}.php`, `backend/app/Adapters/Email/*`, `backend/app/Adapters/Chatbot/*` |
| Proxy | `backend/app/Proxies/CachedProductSourceProxy.php` (envuelve `EloquentProductRepository`) |

## Mapa atributos de calidad â†’ mecanismo implementado

| Atributo | Mecanismo concreto | ValidaciÃ³n |
|---|---|---|
| Seguridad | JWT + 2FA + RBAC + blacklist Redis + FormRequest validation | Test Feature de auth + intento de acceso no autorizado |
| Disponibilidad | CachÃ© Redis catÃ¡logo + colas async para emails/PDFs | Stress test ligero con `wrk` o `k6` |
| Rendimiento | Ãndices DB, eager loading Eloquent, Proxy cachÃ© | MediciÃ³n de p95 <2s en endpoints clave |
| Mantenibilidad | Repository + Service + Strategy/Adapter | MÃ©tricas estÃ¡ticas (PHPStan, ESLint), revisiÃ³n de acoplamiento |
| Trazabilidad | `order_state_logs` + `LogTraceabilityListener` + auditorÃ­a de productos vÃ­a Proxy | Test que verifica registro tras cada cambio de estado |

## Decisiones pendientes de confirmar en kick-off de cada sprint

- **Sprint 1:** `tymon/jwt-auth` vs `laravel/sanctum` para JWT (recomendado: `tymon/jwt-auth` por compatibilidad con blacklist Redis nativa)
- **Sprint 4:** Stripe Test Mode vs PayU Sandbox (recomendado: Stripe por DX, sandbox sin costo)
- **Sprint 5:** proveedor de email (Brevo recomendado por 300 emails/dÃ­a gratis sin tarjeta) y chatbot (BotPress Community vs FAQ rule-based propio)

## VerificaciÃ³n end-to-end

Al final del Sprint 6, un evaluador debe poder:

1. Clonar el repo y ejecutar `docker-compose up -d`
2. Correr `cd backend && php artisan migrate --seed && php artisan serve`
3. Correr `cd frontend && npm install && npm run dev`
4. Ingresar con credenciales seed de cliente â†’ completar 2FA â†’ navegar catÃ¡logo â†’ agregar al carrito â†’ confirmar pedido â†’ ser redirigido a sandbox de pago â†’ completar pago â†’ ver factura PDF descargable y notificaciÃ³n in-app
5. Ingresar como admin â†’ ver el pedido en estado correspondiente â†’ ver el log de trazabilidad del pedido
6. Correr `php artisan test` (backend) y `npm run test:e2e` (frontend) y obtener 100% de los casos crÃ­ticos en verde

## Archivos crÃ­ticos a crear (resumen)

- `docker-compose.yml`, `README.md`, `plan.md` (este documento copiado a la raÃ­z)
- `backend/app/Models/{User,Company,Product,Order,OrderItem,Invoice,Transaction,Notification}.php`
- `backend/app/Repositories/{ProductRepository,OrderRepository}.php` (+ implementaciones Eloquent)
- `backend/app/Services/{AuthService,OrderService,PaymentService,InvoiceService,NotificationService}.php`
- Patrones GoF en sus carpetas (ver tabla arriba)
- `backend/routes/api.php` con grupos por rol y middleware JWT/2FA
- `frontend/src/pages/{auth,catalog,orders,invoices,admin}/*`
- `frontend/src/services/api/*` (un cliente axios por dominio)

