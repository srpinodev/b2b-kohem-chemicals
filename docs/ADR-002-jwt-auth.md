# ADR-002: JWT con tymon/jwt-auth y blacklist en Redis

**Estado:** Aceptado  
**Fecha:** 2026-05-20

## Contexto

La API REST necesita autenticación stateless. Los tokens revocados al hacer logout deben invalidarse sin coordinar estado en la DB por cada request.

## Decisión

- `tymon/jwt-auth` para emitir y validar JWT en el guard `api`
- La blacklist de tokens revocados se almacena en **Redis** con TTL igual al tiempo de expiración del token
- `pragmarx/google2fa-laravel` para TOTP como segundo factor

## Consecuencias

**Positivas:**
- Stateless por defecto — la API escala horizontalmente sin sesiones compartidas
- El blacklist en Redis es O(1) en lectura y se auto-expira sin cleanup manual
- 2FA TOTP funciona sin SMS (sin costo adicional)

**Negativas:**
- Redis es una dependencia de infraestructura requerida (no opcional)
- Si Redis cae, el blacklist de tokens no es consultable — riesgo mitigado con `CACHE_STORE=array` en tests

## Alternativas consideradas

- `laravel/sanctum`: más simple pero el blacklist requiere una tabla en DB con impacto en cada request autenticado
