# Reference: API Endpoints

Base path: `/api/v1`

## Auth

- `POST /auth/login` (public)
- `POST /auth/refresh` (public)
- `POST /auth/logout` (public)

## Health

- `GET /health/liveness` (public)
- `GET /health/readiness` (public)

## Users

- `POST /users` (`ADMIN`)
- `GET /users` (`ADMIN`)
- `GET /users/me` (authenticated)
- `GET /users/:id` (self or `ADMIN`)
- `PATCH /users/:id` (`ADMIN`)
- `DELETE /users/:id` (`ADMIN`)

## Products

- `POST /products` (`ADMIN`)
- `GET /products` (`ADMIN`, `OPERATOR`) active only
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

- `GET /audit` (`ADMIN`)
- `GET /audit/entity/:entity` (`ADMIN`)
- `GET /audit/entity/:entity/:entityId` (`ADMIN`)
- `GET /audit/user/:userId` (`ADMIN`)

## Response Contract

- dettaglio: `{ data: object }`
- lista paginata: `{ data: array, meta: { total, page, limit, totalPages } }`
- errore: `{ statusCode, message, error, timestamp, path, requestId }`

## Restore/Purge status codes

- `restore`:
  - `200` successo
  - `404` risorsa non trovata
  - `409` risorsa non in stato deleted
- `purge`:
  - `204` successo
  - `404` risorsa non trovata
  - `409` risorsa attiva o ancora referenziata
