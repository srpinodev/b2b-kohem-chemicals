# Kohem Chemicals — Plataforma B2B

Plataforma B2B para la venta y gestión de productos químicos en Colombia.  
MVP académico — 12 semanas | 3 integrantes | Layered Architecture + 5 patrones GoF.

## Requisitos previos

| Herramienta | Versión mínima | Propósito |
|---|---|---|
| Docker Desktop | 24+ | MySQL 8, Redis 7, Mailpit |
| PHP | 8.2 | Laravel (vía XAMPP / Laragon / instalación directa) |
| Composer | 2.x | Dependencias PHP |
| Node.js | 20+ | Frontend React |

## Arranque local

### 1. Infraestructura (Docker)

```bash
# Desde la raíz del proyecto
docker-compose up -d
```

Servicios levantados:
- MySQL 8 → `localhost:3306`  (usuario: `kohem`, contraseña: `kohem_secret`)
- Redis 7 → `localhost:6379`
- Mailpit (SMTP dev) → SMTP `localhost:1025` | UI → http://localhost:8025

### 2. Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve            # http://localhost:8000
# (otra terminal) php artisan queue:work
```

**Verificación:** GET http://localhost:8000/api/health → `{ "status": "ok", ... }`

### 3. Frontend (React + Vite)

```bash
cd frontend
npm install                  # si aún no se hizo
npm run dev                  # http://localhost:5173
```

Abre http://localhost:5173 — debe mostrar el panel de estado con los tres indicadores en verde.

## Estructura del proyecto

```
B2B Kohem Chemicals/
├── backend/          # Laravel 11 — API REST
├── frontend/         # React 18 + TypeScript + Vite
├── docs/             # Diagramas C4 (.puml), ADRs
├── docker-compose.yml
├── CLAUDE.md         # Contexto para Claude Code
├── plan.md           # Roadmap por sprint
└── README.md
```

## Comandos útiles

```bash
# Backend
php artisan test                     # PHPUnit
./vendor/bin/pint                    # Formato PSR-12

# Frontend
npm run lint                         # ESLint
npm run format                       # Prettier
npm run test:e2e                     # Playwright E2E

# Docker
docker-compose ps                    # Estado de contenedores
docker-compose logs -f mysql         # Logs MySQL
docker-compose down                  # Detener todo
docker-compose down -v               # Detener y borrar volúmenes (reset BD)
```

## Credenciales de demo (Sprint 6)

Disponibles tras `php artisan migrate --seed` (se añaden en Sprint 6).

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | admin@kohem.co | password |
| Vendedor | vendedor@kohem.co | password |
| Cliente | cliente@empresa.co | password |

## Referencias arquitectónicas

- Documento de soporte: `Documento soporte de proyecto/Evaluación 5.docx`
- Plan de desarrollo: `plan.md`
- Contexto para Claude Code: `CLAUDE.md`
