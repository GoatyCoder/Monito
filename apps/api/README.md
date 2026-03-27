# Monito API

Backend NestJS per il backoffice di tracciabilita agricola.

## Scopo

Questo servizio gestisce:

- autenticazione JWT con refresh token
- autorizzazioni RBAC (`ADMIN`, `OPERATOR`, `USER`)
- CRUD dominio (prodotti, varieta, lotti, lavorati, imballaggi, pedane)
- audit trail applicativo
- health probes operative

## URL principali

- API base (default): `http://localhost:3000/api/v1`
- Swagger (solo non-production): `http://localhost:3000/api/v1/docs`
- Health:
  - `GET /api/v1/health/liveness`
  - `GET /api/v1/health/readiness`

## Quick Start locale

Esegui dalla root del monorepo:

```bash
pnpm install
```

Configura le variabili ambiente (obbligatorie almeno):

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

Esempio minimo (`apps/api/.env`):

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

Avvio in sviluppo:

```bash
cd apps/api
pnpm run dev
```

## Comandi principali

Da `apps/api`:

```bash
pnpm run dev
pnpm run build
pnpm run start:prod

pnpm run lint
pnpm run test
pnpm run test:cov
pnpm run test:e2e

pnpm run prisma:generate
pnpm run prisma:migrate
pnpm run prisma:studio

pnpm run check:all
```

`check:all` esegue il gate completo locale: lint + test + e2e + build + `nest info`.

## Contratti API (regole definitive)

- Envelope risposte:
  - dettaglio: `{ data: ... }`
  - lista non paginata: `{ data: [...] }`
  - lista paginata: `{ data: [...], meta: { total, page, limit, totalPages } }`
- Soft delete per risorse dominio via `DELETE /:id`
- Restore via `POST /:id/restore`
- Purge hard delete via `POST /:id/purge` con body `{ reason }`
- Endpoints separati per cestino: `GET /resource/deleted` e `GET /resource/deleted/:id`
- Endpoints lookup non paginati: `GET /resource/all` (solo record attivi)

## Gestione utenti amministrativa

Per il modulo utenti (`ADMIN`):

- creazione utente con password temporanea: `POST /users` -> `{ user, temporaryPassword }`
- update dati/ruolo: `PATCH /users/:id`
- attiva/disattiva account: `PATCH /users/:id/status` con body `{ isActive }`
- reset password con temporanea: `POST /users/:id/reset-password` -> `{ temporaryPassword }`

Guard rail di sicurezza:

- un admin non puo disattivare o eliminare il proprio account
- non e consentito rimuovere/disattivare/eliminare l\'ultimo admin attivo

Cambio password utente autenticato:

- `POST /auth/change-password` con body `{ currentPassword, newPassword }`
- al primo accesso con password temporanea, il flag `mustChangePassword` forza il cambio password

## Audit log operativo

Eventi principali tracciati:

- CRUD anagrafiche (`CREATE`, `UPDATE`, `SOFT_DELETE`, `RESTORE`, `HARD_DELETE`)
- autenticazione (`LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `PASSWORD_CHANGE`)
- gestione utenti (`STATUS_CHANGE`, `RESET_PASSWORD`, update profilo/preferenze)

Filtri audit disponibili su `GET /audit`:

- filtri singoli: `entity`, `entityId`, `userId`, `operation`
- filtri multipli CSV: `entities`, `userIds`, `operations`
- range temporale: `startDate`, `endDate`
- ordinamento: `sort=timestamp_desc|timestamp_asc`

Comportamento date:

- se `startDate`/`endDate` sono passate come `YYYY-MM-DD`, il backend applica automaticamente inizio/fine giornata (`00:00:00.000` / `23:59:59.999`)

Nota: nelle risposte audit sono inclusi anche `username` e `userDisplayName` per una UI più leggibile, mantenendo `userId` come riferimento tecnico.

## Endpoint lookup non paginati

Per popolare combobox e selector lato frontend senza dipendere da `limit`/paginazione:

- `GET /products/all`
- `GET /varieties/all`
- `GET /field-lots/all`
- `GET /processed-products/all`
- `GET /packagings/all`

Tutti richiedono autenticazione e rispettano RBAC (`ADMIN`, `OPERATOR`).

## Regola codici business e soft delete

Per i codici alfanumerici di `products`, `varieties`, `processed-products`, `packagings`:

- lunghezza massima lato API/input utente: `14`
- lunghezza target lato persistenza: `32`
- in soft delete il codice viene rinominato con suffisso `_del_<timestamp>` restando entro 32 caratteri
- in restore viene ripristinato il codice originale; se quel codice e gia usato da un record attivo, restore risponde `409`

## RBAC

- `ADMIN`: lettura/scrittura completa
- `OPERATOR`: sola lettura su risorse operative
- `USER`: ruolo base non amministrativo

Guard globale JWT attiva. Endpoints pubblici marcati con `@Public()`.

## Database

Schema Prisma in `apps/api/prisma/schema.prisma`.

Note operative:

- attualmente datasource configurato con provider `sqlite`
- migrazioni in `apps/api/prisma/migrations/`
- client generato in `apps/api/generated/prisma/client`

Interpretazione esplicita: il backend attuale e configurato per SQLite/libSQL. Un deploy PostgreSQL richiede modifica del `datasource` Prisma e migrazione dedicata.

## Documentazione completa

- API reference: `apps/api/docs/reference/api-endpoints.md`
- Configurazione: `apps/api/docs/reference/configuration.md`
- Schema database: `apps/api/docs/reference/database-schema.md`
- Strategia test: `apps/api/docs/reference/testing.md`
- Architettura e scelte: `apps/api/docs/explanation/backend-architecture.md`
- Procedure operative: `apps/api/docs/how-to/operations.md`
- Checklist go-live: `apps/api/docs/backend-go-live-checklist.md`

## Note di sicurezza importanti

- In `production` Redis e richiesto per revoca refresh token; se non disponibile, i flussi di revoca rispondono con errore (`503`).
- `JWT_SECRET` e `JWT_REFRESH_SECRET` devono essere sempre impostati via ambiente.

## Note operative su readiness

- `GET /health/readiness`:
  - `200` se servizio pronto o degradato non bloccante
  - `503` se non pronto
- In `production`, Redis down rende readiness `503`.
