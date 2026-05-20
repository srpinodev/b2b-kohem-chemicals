# CLAUDE.md — Kohem Chemicals B2B

Este archivo orienta a futuras sesiones de Claude Code. Léelo antes de cualquier tarea no trivial.

## Qué es este proyecto

Plataforma B2B web para la venta de productos químicos en Colombia. Reemplaza canales tradicionales (teléfono, email, visitas) por un canal digital con catálogo, pedidos, facturación, pagos, notificaciones y soporte automatizado.

- **Equipo:** 3 personas
- **Duración:** ~12 semanas (MVP)
- **Entregable final:** sistema funcional ejecutable en local (`docker-compose up`), sin despliegue público.
- **Contexto académico:** materializa los diagramas C1–C4 documentados en `Documento soporte de proyecto/Evaluación 5.docx`.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend (SPA) | React 18 + TypeScript + Vite, React Router, Zustand, Tailwind, axios |
| Backend (API REST) | PHP 8.2 + Laravel 11 |
| Persistencia | MySQL 8.0 (Eloquent ORM, patrón Repository) |
| Caché / Cola / Sesiones | Redis 7 (cache driver, queue driver, JWT blacklist) |
| Auth | JWT (decisión Sprint 1: `tymon/jwt-auth` vs `laravel/sanctum`) + 2FA TOTP (`pragmarx/google2fa-laravel`) |
| RBAC | `spatie/laravel-permission` |
| Email transaccional | Mailpit en dev; Brevo/Mailtrap/Mailgun en "prod local" (Sprint 5) |
| Pagos | Stripe Test Mode o PayU Sandbox (Sprint 4) |
| Chatbot | Open-source: BotPress Community o FAQ rule-based propio (Sprint 5) |
| PDFs (factura/proforma/NC) | `barryvdh/laravel-dompdf` |
| Tests | PHPUnit (backend), Playwright (E2E) |

**Restricción:** todas las integraciones externas deben usar tier gratuito. No hay presupuesto para servicios pagos.

## Arquitectura

Layered Architecture sobre REST API. Cuatro capas dentro del contenedor Laravel:

1. **Presentación** — Controllers + Middleware (JWT, 2FA, RBAC)
2. **Negocio** — Services + Factories + Strategies + Events/Listeners
3. **Datos** — Repositories sobre Eloquent
4. **Integración** — Adapters para servicios externos

El cliente único es la SPA React, que consume la API vía HTTPS/JSON.

### Patrones GoF — ubicación canónica

| Patrón | Tipo | Ubicación |
|---|---|---|
| Factory Method | Creacional | `backend/app/Factories/Order/{OrderFactory,DirectClientOrderFactory,DistributorOrderFactory}.php` |
| Strategy | Comportamiento | `backend/app/Strategies/Pricing/{PricingStrategy,ListPricingStrategy,DistributorPricingStrategy,VolumePricingStrategy}.php` |
| Observer | Comportamiento | `backend/app/Events/OrderConfirmed.php` + `backend/app/Listeners/*Listener.php` (Laravel Events nativos) |
| Adapter | Estructural | `backend/app/Adapters/{Payment,Email,Chatbot}/*` (interface propia + adapter del SDK externo) |
| Proxy | Estructural | `backend/app/Proxies/CachedProductSourceProxy.php` (envuelve `EloquentProductRepository`) |

**Regla:** ningún Controller, Service o capa de negocio importa SDKs externos directamente. Siempre a través del Adapter correspondiente. Ningún Service consulta Eloquent directamente para productos — usa el Proxy.

### Atributos de calidad → mecanismo

| Atributo | Mecanismo |
|---|---|
| Seguridad | JWT + 2FA + RBAC + blacklist en Redis + FormRequest validation + CORS + rate limiting |
| Disponibilidad | Caché Redis del catálogo + jobs encolados para emails/PDFs |
| Rendimiento | Índices DB, eager loading, Proxy de caché. SLO: p95 < 2s en endpoints ordinarios |
| Mantenibilidad | Capas separadas, inyección de dependencias por interfaces, PHPStan + ESLint |
| Trazabilidad | Tabla `order_state_logs` + `LogTraceabilityListener` en cada `OrderConfirmed`/cambio de estado |

## Estructura del repositorio (monorepo)

```
B2B Kohem Chemicals/
├── backend/                    # Laravel 11
│   ├── app/
│   │   ├── Models/
│   │   ├── Http/Controllers/Api/
│   │   ├── Http/Middleware/
│   │   ├── Http/Requests/      # FormRequests con validación
│   │   ├── Services/
│   │   ├── Repositories/
│   │   ├── Factories/Order/
│   │   ├── Strategies/Pricing/
│   │   ├── Events/
│   │   ├── Listeners/
│   │   ├── Adapters/{Payment,Email,Chatbot}/
│   │   └── Proxies/
│   ├── database/{migrations,seeders,factories}/
│   ├── routes/api.php
│   └── tests/{Unit,Feature}/
├── frontend/                   # React 18 + TS + Vite
│   └── src/{pages,components,hooks,services/api,store,types}/
├── docker-compose.yml          # mysql:8, redis:7, mailpit
├── docs/                       # diagramas C4 .puml, ADRs
├── Documento soporte de proyecto/
│   └── Evaluación 5.docx       # fuente de la arquitectura (no editar)
├── plan.md                     # roadmap detallado por sprint
└── README.md
```

## Comandos de desarrollo local

```bash
# Levantar servicios de infraestructura (MySQL, Redis, Mailpit)
docker-compose up -d

# Backend
cd backend
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate --seed
php artisan serve              # http://localhost:8000
php artisan queue:work         # worker de jobs encolados (otra terminal)
php artisan test               # PHPUnit
./vendor/bin/pint              # formato PHP

# Frontend
cd frontend
npm install
npm run dev                    # http://localhost:5173
npm run lint
npm run test:e2e               # Playwright
```

## Roadmap por sprint (6 × 2 semanas)

| Sprint | Semanas | Foco | Patrones que aparecen |
|---|---|---|---|
| 0 | 1 | Bootstrap monorepo, docker-compose, linters, health check | — |
| 1 | 2–3 | Auth JWT + 2FA, RBAC, Users, Companies | — |
| 2 | 4–5 | Catálogo de productos, Repository | **Proxy** |
| 3 | 6–7 | Pedidos, state machine, trazabilidad | **Factory Method, Strategy, Observer** |
| 4 | 8–9 | Facturación + Pagos (PDFs, IVA 19%, webhooks) | **Adapter** (Payment) |
| 5 | 10–11 | Notificaciones async, chatbot, Laravel Queue | **Adapter** (Email, Chatbot), Observer async |
| 6 | 12 | Hardening, seguridad, perf, E2E, demo, ADRs | — |

Detalle de tareas y entregables por sprint en `plan.md`.

## Convenciones

### Backend
- PSR-12 vía Laravel Pint
- Nombres: `PascalCase` para clases, `camelCase` para métodos y variables, `snake_case` para columnas y rutas
- Inyección de dependencias por interface (`OrderFactory`, `PricingStrategy`, `PaymentGateway`, `ProductSource`) — registrar bindings en `AppServiceProvider`
- Validación en `FormRequest`, no en controllers
- Lógica de negocio nunca en controllers — siempre en `Service`
- Eventos de dominio con Laravel Events; listeners en cola cuando hagan I/O externo
- Tests: Feature para endpoints, Unit para Strategies/Factories/cálculos

### Frontend
- Componentes funcionales + hooks; nada de class components
- Estado global solo cuando se comparte entre rutas — el resto en estado local o `useReducer`
- Cliente HTTP centralizado por dominio en `services/api/`, con interceptor para JWT y refresh
- Tipos TS para todas las respuestas del API en `types/`
- Tailwind para estilos; evitar CSS modules salvo casos puntuales
- Rutas protegidas via `ProtectedRoute` con verificación de rol

### Git
- Branches: `feature/<sprint>-<descripcion>`, `fix/<descripcion>`
- Commits cortos en presente: `feat: agrega OrderFactory`, `fix: corrige cálculo IVA`
- PR por feature; revisión cruzada del equipo
- Los Commits deben decir que yo soy el propietario o quien lo hizo y deben ser subidos a GitHub

## Lo que NO se debe hacer

- **No importar SDKs externos** (Stripe, PayU, BotPress, SendGrid, etc.) fuera de los Adapters de `backend/app/Adapters/`. La capa de negocio solo conoce las interfaces propias.
- **No consultar Eloquent directamente** para productos desde Services o Controllers. Siempre vía `ProductSource` (resuelto por el contenedor al `CachedProductSourceProxy`).
- **No meter lógica de negocio en migrations, controllers ni en componentes React.** Los controllers delegan a Services; los componentes consumen `services/api/`.
- **No agregar patrones por agregarlos.** Los 5 GoF del documento son obligatorios y ya están mapeados a problemas reales — no inventar otros sin justificación.
- **No desplegar a hosting público.** El alcance es local. Si surge la idea de desplegar, primero confirmar con el equipo.
- **No commitear secretos** (`.env`, credenciales de Stripe, tokens). El `.env.example` sí se commitea con placeholders.

## Referencias internas

- `plan.md` — roadmap detallado por sprint (criterios de aceptación, entregables, decisiones pendientes)
- `Documento soporte de proyecto/Evaluación 5.docx` — fuente de la arquitectura, descripción del dominio, justificación de patrones, código PlantUML de los diagramas C1–C3, dentro del archivo tambien hay un enlace para el codigo del C4.
- `docs/` — diagramas exportados y ADRs (Architecture Decision Records) que se irán generando

## Estado actual

**Sprint 0 (Bootstrap) — pendiente de iniciar.** No hay código aún; solo el documento de soporte y este `CLAUDE.md`. El siguiente paso natural es crear `docker-compose.yml`, hacer scaffold de Laravel y de Vite+React+TS, y configurar linters.

## Skills
Puedes usar cualquiera de las skills de mattpocock.
