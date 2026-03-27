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

## Analizzare eventi audit

Esempi utili:

- ultimi eventi auth falliti:
  - `GET /api/v1/audit?operations=LOGIN_FAILED&sort=timestamp_desc&page=1&limit=20`
- cambi stato utenti in un periodo:
  - `GET /api/v1/audit?entities=User&operations=STATUS_CHANGE&startDate=2026-01-01&endDate=2026-01-31`
- attività su più entità:
  - `GET /api/v1/audit?entities=Product,Variety,FieldLot&operations=CREATE,UPDATE`

Nota pratica:

- filtri multipli usano formato CSV (`entities`, `userIds`, `operations`)
- per UI amministrativa sono esposti anche `username` e `userDisplayName` oltre a `userId`
- se usi date in formato `YYYY-MM-DD`, il backend interpreta `endDate` come fine giornata (inclusiva)

## Gestire postazioni condivise (login rapido + lock screen)

Flusso consigliato per postazioni usate da piu operatori:

1. La login UI invia fino a 5 ID locali a `POST /auth/recent-users/hints`.
2. Il backend restituisce solo utenti esistenti e non eliminati con hint minimi (`id`, `username`, `firstName`, `surname`, `avatarColor`, `isActive`).
3. Al login riuscito (`POST /auth/login`) viene aggiornato `lastLoginAt` dell'utente.
4. In caso di inattivita, la UI puo bloccare la schermata e validare password via `POST /auth/verify-password` (utente autenticato).

Body di esempio:

```json
{ "userIds": ["cma1...", "cma2..."] }
```

```json
{ "password": "secret123" }
```

Note operative:

- `recent-users/hints` e pubblico ma accetta massimo 5 ID (oltre ritorna 400)
- `verify-password` richiede JWT valido e ritorna `204 No Content` su successo
- per account disattivati login/verify ritornano errore (`403`)
- lock screen e timeout sono preferenze utente (`lockScreenEnabled`, `lockScreenTimeoutMinutes`, range 1-120)
- lato frontend il lock resta attivo anche dopo refresh tab ed e sincronizzato tra tab browser
- il timeout lock viene contato solo quando la web app e in primo piano (focus/visibility)
