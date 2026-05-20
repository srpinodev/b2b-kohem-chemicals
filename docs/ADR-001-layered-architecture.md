# ADR-001: Arquitectura en Capas sobre REST API

**Estado:** Aceptado  
**Fecha:** 2026-05-20  
**Autores:** Equipo Kohem Chemicals B2B

## Contexto

Se necesita una plataforma B2B para la venta digital de productos químicos en Colombia. El equipo es de 3 personas, con 12 semanas de desarrollo. El sistema debe ser ejecutable en local sin despliegue público.

## Decisión

Se adopta **Layered Architecture** dentro del contenedor Laravel con 4 capas:

1. **Presentación:** Controllers + Middleware (JWT, 2FA, RBAC)
2. **Negocio:** Services + Factories + Strategies + Events/Listeners
3. **Datos:** Repositories sobre Eloquent
4. **Integración:** Adapters para servicios externos

El cliente único es la SPA React, que consume la API vía HTTP/JSON.

## Consecuencias

**Positivas:**
- Separación clara de responsabilidades — los Controllers sólo delegan, la lógica vive en Services
- Los Adapters aislan los SDKs externos (Stripe, Laravel Mail) de la capa de negocio
- Testabilidad: se puede mockear `PaymentGateway` o `EmailGateway` sin credenciales reales
- Mantenibilidad: cambiar de Stripe a PayU requiere sólo un nuevo Adapter, sin tocar Services

**Negativas:**
- Más archivos que en una arquitectura más simple (ej. Active Record puro)
- Requiere disciplina del equipo para no saltarse capas (ej. importar Stripe en un Controller)

## Alternativas consideradas

- **Monolito MVC simple:** más rápido de arrancar pero dificulta la extensión de pasarelas de pago
- **Microservicios:** excesivo para un equipo de 3 personas y un MVP en 12 semanas
