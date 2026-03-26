# Reference: API Endpoints

Base path: `/api/v1`

## Auth

- `POST /auth/login` (public)
- `POST /auth/refresh` (public)
- `POST /auth/logout` (public)
- `POST /auth/change-password` (authenticated)

## Health

- `GET /health/liveness` (public)
- `GET /health/readiness` (public)

## Users

- `POST /users` (`ADMIN`) returns `{ user, temporaryPassword }`
- `GET /users` (`ADMIN`)
- `GET /users/me` (authenticated)
- `PATCH /users/me` (authenticated)
- `GET /users/me/preferences` (authenticated)
- `PATCH /users/me/preferences` (authenticated)
- `GET /users/:id` (self or `ADMIN`)
- `PATCH /users/:id` (`ADMIN`)
- `PATCH /users/:id/status` (`ADMIN`)
- `POST /users/:id/reset-password` (`ADMIN`) returns `{ temporaryPassword }`
- `DELETE /users/:id` (`ADMIN`)

User account behavior:

- `UserResponse` include `isActive` e `mustChangePassword`
- login rifiutato per account disattivati
- password temporanea imposta `mustChangePassword=true`
- `POST /auth/change-password` resetta `mustChangePassword=false` su successo

## Products

- `POST /products` (`ADMIN`)
- `GET /products` (`ADMIN`, `OPERATOR`) active only
- `GET /products/all` (`ADMIN`, `OPERATOR`) active only, no pagination
- `GET /products/deleted` (`ADMIN`)
- `GET /products/deleted/:id` (`ADMIN`)
- `GET /products/:id` (`ADMIN`, `OPERATOR`)
- `PATCH /products/:id` (`ADMIN`)
- `DELETE /products/:id` (`ADMIN`) soft delete
- `POST /products/:id/restore` (`ADMIN`) restore
- `POST /products/:id/purge` (`ADMIN`) hard delete with reason

## Varieties

- `POST /varieties` (`ADMIN`)
- `GET /varieties` (`ADMIN`, `OPERATOR`) active only
- `GET /varieties/all` (`ADMIN`, `OPERATOR`) active only, no pagination
- `GET /varieties/deleted` (`ADMIN`)
- `GET /varieties/deleted/:id` (`ADMIN`)
- `GET /varieties/:id` (`ADMIN`, `OPERATOR`)
- `PATCH /varieties/:id` (`ADMIN`)
- `DELETE /varieties/:id` (`ADMIN`)
- `POST /varieties/:id/restore` (`ADMIN`)
- `POST /varieties/:id/purge` (`ADMIN`)
- `GET /products/:productId/varieties` (`ADMIN`, `OPERATOR`)

## Field Lots

- `POST /field-lots` (`ADMIN`)
- `GET /field-lots` (`ADMIN`, `OPERATOR`) active only
- `GET /field-lots/all` (`ADMIN`, `OPERATOR`) active only, no pagination
- `GET /field-lots/deleted` (`ADMIN`)
- `GET /field-lots/deleted/:id` (`ADMIN`)
- `GET /field-lots/:id` (`ADMIN`, `OPERATOR`)
- `PATCH /field-lots/:id` (`ADMIN`)
- `DELETE /field-lots/:id` (`ADMIN`)
- `POST /field-lots/:id/restore` (`ADMIN`)
- `POST /field-lots/:id/purge` (`ADMIN`)

## Processed Products

- `POST /processed-products` (`ADMIN`)
- `GET /processed-products` (`ADMIN`, `OPERATOR`) active only
- `GET /processed-products/all` (`ADMIN`, `OPERATOR`) active only, no pagination
- `GET /processed-products/deleted` (`ADMIN`)
- `GET /processed-products/deleted/:id` (`ADMIN`)
- `GET /processed-products/:id` (`ADMIN`, `OPERATOR`)
- `PATCH /processed-products/:id` (`ADMIN`)
- `DELETE /processed-products/:id` (`ADMIN`)
- `POST /processed-products/:id/restore` (`ADMIN`)
- `POST /processed-products/:id/purge` (`ADMIN`)

## Packagings

- `POST /packagings` (`ADMIN`)
- `GET /packagings` (`ADMIN`, `OPERATOR`) active only
- `GET /packagings/all` (`ADMIN`, `OPERATOR`) active only, no pagination
- `GET /packagings/deleted` (`ADMIN`)
- `GET /packagings/deleted/:id` (`ADMIN`)
- `GET /packagings/:id` (`ADMIN`, `OPERATOR`)
- `PATCH /packagings/:id` (`ADMIN`)
- `DELETE /packagings/:id` (`ADMIN`)
- `POST /packagings/:id/restore` (`ADMIN`)
- `POST /packagings/:id/purge` (`ADMIN`)

## Pallets

- `POST /pallets` (`ADMIN`)
- `GET /pallets` (`ADMIN`, `OPERATOR`) active only
- `GET /pallets/deleted` (`ADMIN`)
- `GET /pallets/deleted/:id` (`ADMIN`)
- `GET /pallets/by-number/:palletNumber` (`ADMIN`, `OPERATOR`)
- `GET /pallets/:id` (`ADMIN`, `OPERATOR`)
- `PATCH /pallets/:id` (`ADMIN`)
- `DELETE /pallets/:id` (`ADMIN`)
- `POST /pallets/:id/restore` (`ADMIN`)
- `POST /pallets/:id/purge` (`ADMIN`)

## Audit

- `GET /audit` (`ADMIN`) con filtri e sort
- `GET /audit/entity/:entity` (`ADMIN`)
- `GET /audit/entity/:entity/:entityId` (`ADMIN`)
- `GET /audit/user/:userId` (`ADMIN`)

Query principali su `GET /audit`:

- singoli: `entity`, `entityId`, `userId`, `operation`
- multipli CSV: `entities`, `userIds`, `operations`
- temporali: `startDate`, `endDate`
- ordinamento: `sort=timestamp_desc|timestamp_asc`

Operazioni audit supportate:

- `CREATE`, `UPDATE`, `SOFT_DELETE`, `RESTORE`, `HARD_DELETE`
- `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `PASSWORD_CHANGE`
- `RESET_PASSWORD`, `STATUS_CHANGE`

Audit payload response:

- mantiene `userId` tecnico
- aggiunge `username` e `userDisplayName` per visualizzazione user-friendly

## Response Contract

- dettaglio: `{ data: object }`
- lista non paginata: `{ data: array }`
- lista paginata: `{ data: array, meta: { total, page, limit, totalPages } }`
- errore: `{ statusCode, message, error, timestamp, path, requestId }`

## Code fields policy (domain master data)

Per `products`, `varieties`, `processed-products`, `packagings`:

- input API `code`: max `14` caratteri alfanumerici
- soft delete: rename automatico in `<code>_del_<timestamp>` con cap finale `32`
- restore: ripristina il codice originale, ma puo restituire `409` se il codice e gia riutilizzato da un record attivo

## Restore/Purge status codes

- `restore`:
  - `200` successo
  - `404` risorsa non trovata
  - `409` risorsa non in stato deleted
- `purge`:
  - `204` successo
  - `404` risorsa non trovata
  - `409` risorsa attiva o ancora referenziata
