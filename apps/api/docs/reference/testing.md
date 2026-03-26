# Reference: Testing Strategy

## Comandi

Da `apps/api`:

```bash
pnpm run test
pnpm run test:cov
pnpm run test:e2e
pnpm run test:e2e -- test/rbac-real.e2e-spec.ts
pnpm run check:all
```

## Tipi di test

- Unit/service/guard/policy tests in `src/**/*.spec.ts`
- Real E2E tests in `test/**/*.e2e-spec.ts`

## Suite correnti

### Unit/Integration (`src/**/*.spec.ts`)

- `src/modules/auth/auth.service.spec.ts`
- `src/modules/auth/guards/roles.guard.spec.ts`
- `src/modules/audit/audit.service.spec.ts`
- `src/modules/users/users.service.spec.ts`
- `src/modules/products/products.service.spec.ts`
- `src/modules/varieties/varieties.service.spec.ts`
- `src/modules/packagings/packagings.service.spec.ts`
- `src/modules/processed-products/processed-products.service.spec.ts`
- `src/modules/field-lots/field-lots.service.spec.ts`
- `src/modules/rbac-policy.spec.ts`
- `src/modules/rbac-http.e2e.spec.ts`
- `src/common/dto/purge-request.dto.spec.ts`

### Real E2E (`test/**/*.e2e-spec.ts`)

- `test/rbac-real.e2e-spec.ts`

Copre:

- auth/rbac reali con `AppModule`
- health probes pubbliche
- policy `ADMIN`/`OPERATOR`
- workflow delete/restore/purge
- blocco purge su referenze reali

## Criteri minimi di passaggio

- lint pulito
- test unit/integration verdi
- e2e reale verde
- build production verde

Comando unico consigliato: `pnpm run check:all`.
