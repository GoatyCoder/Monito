# Reference: API Endpoints

Base path: `/api/v1`

## Auth

- `POST /auth/login` (public)
- `POST /auth/refresh` (public)
- `POST /auth/logout` (public)
- `POST /auth/change-password` (authenticated)
- `POST /auth/verify-password` (authenticated)
- `POST /auth/recent-users/hints` (public, max 5 userIds)

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
- `UserResponse` include `lastLoginAt`
- login rifiutato per account disattivati
- password temporanea imposta `mustChangePassword=true`
- `POST /auth/change-password` resetta `mustChangePassword=false` su successo
- preferenze utente includono lock screen (`lockScreenEnabled`, `lockScreenTimeoutMinutes`)

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

Variety notes:

- `code` univoco per `productId` (non globale)
- `productSubtypeId` opzionale, ma se presente deve appartenere allo stesso prodotto

## Product Subtypes

- `POST /product-subtypes` (`ADMIN`)
- `GET /product-subtypes` (`ADMIN`, `OPERATOR`) active only
- `GET /product-subtypes/all` (`ADMIN`, `OPERATOR`) active only, no pagination
- `GET /product-subtypes/deleted` (`ADMIN`)
- `GET /product-subtypes/deleted/:id` (`ADMIN`)
- `GET /product-subtypes/:id` (`ADMIN`, `OPERATOR`)
- `PATCH /product-subtypes/:id` (`ADMIN`)
- `DELETE /product-subtypes/:id` (`ADMIN`)
- `POST /product-subtypes/:id/restore` (`ADMIN`)
- `POST /product-subtypes/:id/purge` (`ADMIN`)
- `GET /products/:productId/subtypes/all` (`ADMIN`, `OPERATOR`)

ProductSubtype notes:

- `code` univoco per `productId` (non globale)

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

Origin lookup endpoints:

- `GET /field-lots/origins/countries` (`ADMIN`, `OPERATOR`)
- `GET /field-lots/origins/it/regions` (`ADMIN`, `OPERATOR`)
- `GET /field-lots/origins/it/provinces?regionCode=..` (`ADMIN`, `OPERATOR`)
- `GET /field-lots/origins/it/comuni?regionCode=..&provinceCode=..&search=..` (`ADMIN`, `OPERATOR`)

FieldLot origin fields:

- `originCountryCode` (obbligatorio, ISO 3166-1 alpha-2)
- `originRegion` (opzionale, codice ISTAT regione per Italia)
- `originProvince` (opzionale, codice ISTAT provincia per Italia)
- `originComune` (opzionale, codice ISTAT comune per Italia)

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

ProcessedProduct constraints notes:

- supporta vincoli opzionali multipli con OR globale:
  - `allowedProductIds`
  - `allowedSubtypeIds`
  - `allowedVarietyIds`
- senza vincoli, il lavorato e utilizzabile su qualsiasi prodotto/varieta

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

Packaging fields:

- `tareKg` (tara in kg)
- `outerLengthMm` (lunghezza esterna in mm)
- `outerWidthMm` (larghezza esterna in mm)
- `outerHeightMm` (altezza esterna in mm)

Esempio payload `POST /packagings`:

```json
{
  "code": "IFCO6410",
  "name": "IFCO 6410",
  "description": "Cassa plastica standard",
  "tareKg": 0.35,
  "outerLengthMm": 600,
  "outerWidthMm": 400,
  "outerHeightMm": 120
}
```

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

Nota date:

- con formato `YYYY-MM-DD`, `startDate` viene interpretata a inizio giornata e `endDate` a fine giornata

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

Per `products`, `product-subtypes`, `varieties`, `processed-products`, `packagings`:

- input API `code`: max `14` caratteri alfanumerici
- soft delete: rename automatico in `<code>_del_<timestamp>` con cap finale `32`
- restore: ripristina il codice originale, ma puo restituire `409` se il codice e gia riutilizzato da un record attivo

Regola di scope per unicita codice:

- `products`, `processed-products`, `packagings`: scope globale
- `product-subtypes`, `varieties`: scope per `productId`

## Units Policy

- dimensioni: `mm` (interi)
- pesi: `kg` (massimo 3 decimali)

## Error contract

Le risposte errore espongono sempre `code` stabile per la traduzione lato frontend:

```json
{
  "statusCode": 401,
  "code": "AUTH_INVALID_PASSWORD",
  "message": "Invalid password",
  "error": "Unauthorized",
  "timestamp": "2026-03-29T10:00:00.000Z",
  "path": "/api/v1/auth/login",
  "requestId": "..."
}
```

Codici principali iniziali:

- `AUTH_USER_NOT_FOUND`, `AUTH_INVALID_PASSWORD`, `AUTH_USER_DISABLED`
- `VALIDATION_ERROR`, `RESOURCE_NOT_FOUND`, `CONFLICT`, `BAD_REQUEST`, `INTERNAL_ERROR`
- `DB_UNIQUE_CONSTRAINT`, `DB_FOREIGN_KEY_CONSTRAINT`, `DB_RECORD_NOT_FOUND`

## Restore/Purge status codes

- `restore`:
  - `200` successo
  - `404` risorsa non trovata
  - `409` risorsa non in stato deleted
- `purge`:
  - `204` successo
  - `404` risorsa non trovata
  - `409` risorsa attiva o ancora referenziata
