# How-to: operazioni comuni backend

## Eseguire il quality gate completo

Da `apps/api`:

```bash
pnpm run check:all
```

Questo comando esegue, in ordine:

1. `pnpm run lint`
2. `pnpm run test`
3. `pnpm run test:e2e -- test/rbac-real.e2e-spec.ts`
4. `pnpm run build`
5. `pnpm exec nest info`

## Creare una migrazione Prisma

Da `apps/api`:

```bash
pnpm run prisma:migrate -- --name <nome_migrazione>
pnpm run prisma:generate
```

## Rieseguire solo E2E reali

Da `apps/api`:

```bash
pnpm run test:e2e -- test/rbac-real.e2e-spec.ts
```

## Debug rapido readiness

Se `GET /health/readiness` risponde `503`:

1. verifica `DATABASE_URL`
2. verifica raggiungibilita Redis (solo se `NODE_ENV=production`)
3. verifica log applicativi con `x-request-id`

## Gestione soft delete e purge

Per ogni modulo dominio:

1. soft delete con `DELETE /resource/:id`
2. restore con `POST /resource/:id/restore`
3. purge definitivo con `POST /resource/:id/purge` e body:

```json
{ "reason": "motivo obbligatorio" }
```

Il purge puo restituire `409` se la risorsa e ancora referenziata.

## Popolare combobox senza paginazione

Per lookup UI (selector/combobox), usare endpoint `all` sui moduli anagrafica principali:

- `GET /products/all`
- `GET /varieties/all`
- `GET /field-lots/all`
- `GET /processed-products/all`
- `GET /packagings/all`

Questi endpoint ritornano solo record attivi in formato `{ data: [...] }`.
