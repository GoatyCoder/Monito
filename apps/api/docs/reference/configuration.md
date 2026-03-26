# Reference: Configuration

Configurazione validata in `apps/api/src/app.module.ts` (`ConfigModule` + Joi).

## Variabili ambiente

### Core

- `NODE_ENV` = `development | production | test`
- `PORT` (default `3000`)
- `API_PREFIX` (default `api/v1`)
- `CORS_ORIGINS` (CSV origini)

### Database

- `DATABASE_URL` (obbligatoria)

### JWT

- `JWT_SECRET` (obbligatoria, min 32)
- `JWT_EXPIRES_IN` (default `15m`)
- `JWT_REFRESH_SECRET` (obbligatoria, min 32)
- `JWT_REFRESH_EXPIRES_IN` (default `7d`)

### Redis

- `REDIS_HOST` (default `localhost`)
- `REDIS_PORT` (default `6379`)
- `REDIS_PASSWORD` (opzionale)

### Password hashing

- `BCRYPT_SALT_ROUNDS` (default `12`, range `10..20`)

## Comportamenti dipendenti da ambiente

- Swagger attivo solo se `NODE_ENV !== production`
- In `production`, il revocation store refresh token (Redis) e obbligatorio
- In `test`, Redis usa client in-memory noop per evitare dipendenze esterne
- `health/readiness` restituisce `503` solo in stato `not_ready`
