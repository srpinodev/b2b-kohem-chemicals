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

## Setup desde cero (clon limpio)

### 1. Clonar y posicionarse

```bash
git clone https://github.com/srpinodev/b2b-kohem-chemicals.git
cd b2b-kohem-chemicals
```

### 2. Levantar infraestructura

```bash
docker-compose up -d
```

| Servicio | Puerto | Notas |
|---|---|---|
| MySQL 8 | 3306 | usuario: `kohem`, contraseña: `kohem_secret` |
| Redis 7 | 6379 | caché, colas, blacklist JWT |
| Mailpit | SMTP 1025 / UI 8025 | captura emails en dev → http://localhost:8025 |

Verificación: `docker ps` debe listar `kohem_mysql`, `kohem_redis`, `kohem_mailpit` con estado `healthy`.

### 3. Backend (Laravel 11)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan jwt:secret
php artisan storage:link        # symlink para servir PDFs y SDS
php artisan migrate --seed      # crea tablas + datos demo
```

Luego, **dos terminales separadas dentro de `backend/`**:

```bash
# Terminal A — API
php artisan serve               # http://localhost:8000

# Terminal B — worker de jobs (emails, PDFs, notificaciones)
php artisan queue:work --queue=emails,default
```

Verificar: `curl http://localhost:8000/api/health` → `{"status":"ok"}`.

### 4. Frontend (React 18 + Vite)

```bash
cd ../frontend
npm install
npm run dev                     # http://localhost:5173
```

---

## Credenciales demo (después de `migrate --seed`)

| Rol | Email | Contraseña | Empresa |
|---|---|---|---|
| Administrador | `admin@kohem.co` | `password` | — |
| Vendedor | `vendedor@kohem.co` | `password` | — |
| Cliente directo | `cliente@demo.co` | `password` | Laboratorios Andinos S.A.S |
| Cliente directo 2 | `cliente2@demo.co` | `password` | Química Industrial del Valle S.A |
| Distribuidor | `distribuidor@demo.co` | `password` | Distribuidora Nacional de Reactivos Ltda |

---

## Flujo de demo end-to-end

1. Login como `cliente@demo.co` → catálogo → agregar al carrito → **Confirmar pedido**.
2. Abre otra pestaña como `vendedor@kohem.co` → Pedidos → cambiar el estado a **Confirmado**.
3. Vuelve a la pestaña del cliente: el estado se actualiza solo (~5 s).
4. **Pagar pedido** → **Pagar con tarjeta** → si Stripe está en placeholders, `FakeStripeAdapter` simula la pasarela. Si usas keys reales, tarjeta de prueba `4242 4242 4242 4242`.
5. **Mis Facturas** → la factura queda `paid` y puedes descargar el PDF.
6. Como `admin@kohem.co`: `/admin/products` (CRUD) y `/admin/users` (crear/desactivar/reset password).

---

## Correos (Mailpit y SMTP real)

### Mailpit (modo dev — recomendado para demo)

Por defecto el `.env` apunta a Mailpit en `127.0.0.1:1025`. Mailpit **no envía nada hacia afuera**: captura todos los correos enviados por la app y los muestra en su UI web.

- **UI:** http://localhost:8025
- Cada flujo genera un correo. Para verlo, basta abrir la UI y refrescar.

### ¿Qué dispara cada correo?

| Acción | Correo enviado | Asunto |
|---|---|---|
| Cliente confirma su pedido (`pending → confirmed`) | Cliente | `Pedido <N> confirmado — Kohem Chemicals` |
| Vendedor cambia a `processing` / `shipped` / `delivered` / `cancelled` | Cliente dueño | `Pedido <N> — <estado>` |
| Pago completado / factura emitida | Cliente | `Factura <N> — Kohem Chemicals` |
| Admin crea un usuario | El usuario nuevo | `Bienvenido a Kohem Chemicals` (incluye contraseña inicial) |
| Admin resetea contraseña | El usuario afectado | `Tu contraseña ha sido restablecida — Kohem Chemicals` |

> **Importante:** estos correos están encolados (`ShouldQueue`). Si el worker `php artisan queue:work` **no está corriendo**, los correos quedan pendientes en Redis. Si los emails no aparecen en Mailpit, lo primero es revisar el worker.

### Recibir los correos en tu Gmail / Outlook real

Edita `backend/.env` con un SMTP real (sirve cualquier proveedor con tier gratis: Brevo, Mailtrap, Resend, Mailgun, etc.). Ejemplo con Mailtrap sandbox:

```env
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=tu_user_mailtrap
MAIL_PASSWORD=tu_pass_mailtrap
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@kohem.co"
MAIL_FROM_NAME="${APP_NAME}"
```

Después: `php artisan config:clear` y reinicia el `queue:work`.

Para probar con **tu propio correo**: como admin en `/admin/users`, crea un usuario nuevo poniendo tu email real. Te llegará el correo de bienvenida con la contraseña inicial. Luego puedes hacer un reset y recibirás el segundo correo.

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
│   │   ├── Notifications/    # Database + Mail (in-app + email)
│   │   ├── Proxies/          # Proxy: CachedProductSourceProxy
│   │   ├── Repositories/     # Repository Pattern
│   │   ├── Services/         # Capa de negocio
│   │   └── Strategies/       # Strategy: PricingStrategy
│   ├── database/
│   └── tests/
├── frontend/                 # React 18 + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/            # usePolling, useDebounce
│   │   ├── pages/            # auth, catalog, orders, invoices, admin
│   │   ├── services/api/     # Clientes HTTP por dominio
│   │   ├── store/            # Zustand: authStore, cartStore, realtimeStore
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
| Adapter | Estructural | `backend/app/Adapters/{Payment,Email,Chatbot}/` (Stripe real + `FakeStripeAdapter` para demo local) |
| Proxy | Estructural | `backend/app/Proxies/CachedProductSourceProxy.php` |

---

## Comandos útiles

```bash
# Backend
php artisan test                     # PHPUnit
./vendor/bin/pint                    # Formato PSR-12
php artisan cache:clear              # Limpiar caché Redis (si datos quedaron stale)

# Frontend
npm run build                        # TypeScript + Vite build
npm run lint                         # ESLint
npm run test:e2e                     # Playwright (requiere API + dev server arriba)

# Docker
docker-compose ps
docker-compose logs -f
docker-compose down -v               # Reset completo (borra BD — luego correr migrate --seed)
```

---

## Problemas comunes

| Síntoma | Solución |
|---|---|
| `php: command not found` | Agregar `C:\xampp\php` al PATH (Windows) o `which php` para confirmar instalación |
| `SQLSTATE: table doesn't exist` | Faltó correr `php artisan migrate --seed` |
| Login devuelve 429 | Throttle: 10 req/min. Esperar un minuto o `docker-compose restart redis` |
| Productos no se reflejan al editar | Caché Redis. `php artisan cache:clear` |
| Pagar pedido tira `$config must be...` | Stripe sin keys reales. El `FakeStripeAdapter` debería activarse automáticamente; si no, revisar `config/services.php` y `php artisan config:clear` |
| Correos no aparecen en Mailpit | Worker no está corriendo. Lanzar `php artisan queue:work --queue=emails,default` |
| Estado del pedido no se actualiza solo | `queue:work` no procesa eventos. Reiniciarlo. El polling del frontend lo recogerá igual en 5–15 s |
| Reset total | `docker-compose down -v && docker-compose up -d && php artisan migrate --seed` |

---

## Atributos de calidad

| Atributo | Mecanismo | Verificación |
|---|---|---|
| Seguridad | JWT + 2FA TOTP + RBAC + throttle (10 req/min en auth) + CORS restringido | Tests de auth + intento rol incorrecto |
| Disponibilidad | Caché Redis catálogo (TTL 5 min) + jobs en cola para email/PDF | `GET /api/catalog` sin DB activa sigue respondiendo |
| Rendimiento | Índices compuestos en orders/products/notifications + eager loading | p95 < 2s en endpoints ordinarios |
| Mantenibilidad | Layered Architecture + DI por interfaces + PHPStan + ESLint | 0 errores de tipado en build TS |
| Trazabilidad | `order_state_logs` + `LogTraceabilityListener` + notificaciones in-app + email | Tests verifican log y correo por cada cambio de estado |

---

## ADRs

- [ADR-001: Arquitectura en Capas](docs/ADR-001-layered-architecture.md)
- [ADR-002: JWT con blacklist en Redis](docs/ADR-002-jwt-auth.md)
- [ADR-003: Stripe como pasarela de pago](docs/ADR-003-stripe-adapter.md)
- [ADR-004: Desviaciones justificadas entre el diagrama C4 y la implementación](docs/ADR-004-desviaciones-c4.md)
