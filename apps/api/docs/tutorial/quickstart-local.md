# Tutorial: avvio locale completo

Obiettivo: avviare l'API in locale e verificare che risponda correttamente.

## Prerequisiti

- Node.js e pnpm installati
- monorepo clonato

## 1) Installa dipendenze

Dalla root del repository:

```bash
pnpm install
```

## 2) Configura ambiente backend

Crea `apps/api/.env` con almeno queste variabili:

```env
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="replace_with_min_32_chars_secret_value"
JWT_REFRESH_SECRET="replace_with_min_32_chars_refresh_secret"
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGINS=http://localhost:5173
```

## 3) Genera client Prisma

```bash
cd apps/api
pnpm run prisma:generate
```

## 4) Avvia API

```bash
pnpm run dev
```

## 5) Verifica endpoint base

In un nuovo terminale:

```bash
curl http://localhost:3000/api/v1/health/liveness
curl http://localhost:3000/api/v1/health/readiness
```

Entrambi devono rispondere `200` in sviluppo.

## 6) (Opzionale) crea admin seed

```bash
pnpm tsx src/seed.ts
```

## Risultato atteso

- API attiva su `http://localhost:3000/api/v1`
- Swagger disponibile su `http://localhost:3000/api/v1/docs` (non-production)
- health probes operative
