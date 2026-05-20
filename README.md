# Kohem Chemicals — Plataforma B2B

Plataforma B2B para la venta y gestión de productos químicos en Colombia.  
MVP académico · 12 semanas · 3 integrantes · Layered Architecture + 5 patrones GoF.

---

## Requisitos previos

| Herramienta | Versión mínima | Propósito |
|---|---|---|
| Docker Desktop | 24+ | MySQL 8, Redis 7, Mailpit |
| PHP | 8.2 | Laravel (vía XAMPP / Laragon / instalación directa) |
| Composer | 2.x | Dependencias PHP |
| Node.js | 20+ | Frontend React |

---

## Arranque local

### 1. Infraestructura (Docker)

```bash
docker-compose up -d
```

| Servicio | Puerto | Notas |
|---|---|---|
| MySQL 8 | 3306 | usuario: `kohem`, contraseña: `kohem_secret` |
| Redis 7 | 6379 | caché, colas, blacklist JWT |
| Mailpit | SMTP 1025 / UI 8025 | captura emails en dev → http://localhost:8025 |

### 2. Backend (Laravel 11)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan jwt:secret       # genera JWT_SECRET en .env
php artisan migrate --seed   # crea tablas y datos demo
php artisan serve            # API en http://localhost:8000
# (terminal separada)
php artisan queue:work       # procesa jobs de email/PDF
```

Verificar: `GET http://localhost:8000/api/health` → `{ "status": "ok" }`

### 3. Frontend (React 18 + Vite)

```bash
cd frontend
npm install
npm run dev                  # SPA en http://localhost:5173
```

---

## Credenciales de demo

Disponibles tras `php artisan migrate --seed`:

| Rol | Email | Contraseña | Empresa |
|---|---|---|---|
| Administrador | admin@kohem.co | password | — |
| Vendedor | vendedor@kohem.co | password | — |
| Cliente (directo) | cliente@demo.co | password | Laboratorios Andinos S.A.S |
| Cliente (directo 2) | cliente2@demo.co | password | Química Industrial del Valle S.A |
| Distribuidor | distribuidor@demo.co | password | Distribuidora Nacional de Reactivos Ltda |

---

## Flujo de demo end-to-end

1. `docker-compose up -d` + `php artisan serve` + `php artisan queue:work` + `npm run dev`
2. Ingresar como **cliente@demo.co** / password → completar 2FA (si está habilitado)
3. Navegar el catálogo → agregar productos al carrito → confirmar pedido
4. Confirmar el pedido como vendedor → el pedido pasa a `confirmed`
5. Ir a "Pagar pedido" → Stripe Test Mode → usar tarjeta `4242 4242 4242 4242`
6. Ver la factura generada en PDF desde "Mis Facturas"
7. Verificar notificación in-app en la campana
8. Abrir el chat y escribir una consulta (ej: "¿cómo pago?")

---

## Estructura del proyecto

```
B2B Kohem Chemicals/
├── backend/                  # Laravel 11 — API REST
│   ├── app/
│   │   ├── Adapters/         # Adapter: Payment, Email, Chatbot
│   │   ├── Events/           # Observer: OrderConfirmed, OrderStatusChanged
│   │   ├── Factories/Order/  # Factory Method: OrderFactory
│   │   ├── Http/             # Controllers, Middleware, Requests
│   │   ├── Listeners/        # Observer listeners (en cola)
│   │   ├── Models/
│   │   ├── Notifications/    # Laravel Notifications (in-app)
│   │   ├── Proxies/          # Proxy: CachedProductSourceProxy
│   │   ├── Repositories/     # Repository Pattern
│   │   ├── Services/         # Capa de negocio
│   │   └── Strategies/       # Strategy: PricingStrategy
│   ├── database/
│   └── tests/
├── frontend/                 # React 18 + TypeScript + Vite
│   ├── src/
│   │   ├── components/       # Layout, NotificationBell, ChatWidget
│   │   ├── pages/            # Por dominio: auth, catalog, orders, invoices
│   │   ├── services/api/     # Clientes HTTP por dominio
│   │   ├── store/            # Zustand: authStore, cartStore
│   │   └── types/
│   └── e2e/                  # Tests Playwright
├── docs/                     # ADRs y diagramas C4
├── docker-compose.yml
└── README.md
```

---

## Patrones GoF implementados

| Patrón | Tipo | Ubicación |
|---|---|---|
| Factory Method | Creacional | `backend/app/Factories/Order/` |
| Strategy | Comportamiento | `backend/app/Strategies/Pricing/` |
| Observer | Comportamiento | `backend/app/Events/` + `backend/app/Listeners/` |
| Adapter | Estructural | `backend/app/Adapters/{Payment,Email,Chatbot}/` |
| Proxy | Estructural | `backend/app/Proxies/CachedProductSourceProxy.php` |

---

## Comandos de desarrollo

```bash
# Backend
php artisan test                     # 53 tests PHPUnit
./vendor/bin/pint                    # Formato PSR-12

# Frontend
npm run build                        # TypeScript + Vite build
npm run lint                         # ESLint
npm run test:e2e                     # Playwright E2E (requiere dev server activo)

# Docker
docker-compose ps
docker-compose logs -f
docker-compose down -v               # Reset completo (borra BD)
```

---

## Atributos de calidad

| Atributo | Mecanismo | Verificación |
|---|---|---|
| Seguridad | JWT + 2FA TOTP + RBAC + throttle (10 req/min en auth) + CORS restringido | Tests de auth + intento rol incorrecto |
| Disponibilidad | Caché Redis catálogo (TTL 5 min) + jobs en cola para email/PDF | `GET /api/catalog` sin DB activa sigue respondiendo |
| Rendimiento | Índices compuestos en orders/products/notifications + eager loading | p95 < 2s en endpoints ordinarios |
| Mantenibilidad | Layered Architecture + DI por interfaces + PHPStan + ESLint | 0 errores de tipado en build TS |
| Trazabilidad | `order_state_logs` + `LogTraceabilityListener` + notificaciones in-app | Test verifica log por cada cambio de estado |

---

## ADRs

- [ADR-001: Arquitectura en Capas](docs/ADR-001-layered-architecture.md)
- [ADR-002: JWT con blacklist en Redis](docs/ADR-002-jwt-auth.md)
- [ADR-003: Stripe como pasarela de pago](docs/ADR-003-stripe-adapter.md)
