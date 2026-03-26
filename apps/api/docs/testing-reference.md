# Backend Testing Reference

This document describes the current backend testing strategy for `apps/api`, what is covered, and what is still missing.

## Test Commands

- Unit/integration suite (Jest on `src/**/*.spec.ts`):

```bash
pnpm run test
```

- Coverage report:

```bash
pnpm run test:cov
```

- E2E suite (Jest on `test/**/*.e2e-spec.ts`):

```bash
pnpm run test:e2e
```

- Single E2E file (current real RBAC and relational checks):

```bash
pnpm run test:e2e -- test/rbac-real.e2e-spec.ts
```

## Test Suite Inventory

### Unit and service-level specs (`src/**/*.spec.ts`)

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
- `src/modules/rbac-http.e2e.spec.ts` (HTTP-style RBAC test with mocked services)
- `src/common/dto/purge-request.dto.spec.ts`

### Real E2E specs (`test/**/*.e2e-spec.ts`)

- `test/rbac-real.e2e-spec.ts`
  - boots real `AppModule`
  - uses real database schema (`prisma db push` on test DB)
  - validates auth/authorization flow and key relational constraints

## Coverage Summary (Current)

Based on the latest run (`pnpm run test:cov`):

- Overall statement coverage: ~47.65%
- Overall branch coverage: ~43.22%

Important note: service-level coverage for the audited modules is much higher than global coverage. Global coverage is pulled down by untested infrastructure and modules still without dedicated tests.

## What Is Implemented Well

- Strong CRUD/business-rule coverage for:
  - `products`, `varieties`, `packagings`, `processed-products`, `field-lots`
- Correct purge lifecycle checks:
  - active record purge blocked
  - soft-delete required before purge
  - purge blocked when referenced (unit + real E2E)
- RBAC checks:
  - role metadata matrix checks (`rbac-policy.spec.ts`)
  - guard behavior checks (`roles.guard.spec.ts`)
  - HTTP behavior checks for `401/403` in both mock-HTTP and real E2E contexts
- DTO validation coverage for purge reason (`PurgeRequestDto`)

## What Is Still Missing

### 1) Pallets module test coverage

Coverage for `src/modules/pallets/*` is currently near 0.

Missing tests include:

- `PalletsService`:
  - create validation (`items` required, references required)
  - pallet number generation behavior
  - weight calculations
  - soft delete / restore / hard delete behavior
  - audit payload correctness
- `PalletsController`:
  - RBAC policy and endpoint behavior
  - response code contracts

### 2) Controller contract tests for many modules

Most controller files still have very low direct coverage.

Missing checks include:

- route-level status code expectations per endpoint
- request validation edge cases at controller boundary
- response wrapping consistency (`{ data }`, `{ data, meta }`) per route

### 3) Global infrastructure and error filter coverage

Currently untested or weakly tested:

- `main.ts` bootstrap behavior
- `app.module.ts` provider graph behavior
- `global-exception.filter.ts`
- `prisma-exception.filter.ts`
- `redis.module.ts`
- `prisma.service.ts` lifecycle behavior

### 4) Negative and edge E2E scenarios

Still useful to add:

- token expiration / malformed token behavior in real E2E
- 404 matrix for deleted vs active endpoints (`/deleted/:id`, `/:id`)
- pagination/filter/sort behavior assertions on list endpoints
- concurrency/idempotency checks on delete/restore/purge actions

## Recommended Next Test Milestones

1. Add `pallets.service.spec.ts` and `pallets.controller` HTTP/RBAC tests.
2. Add controller contract tests for each domain module (table-driven where possible).
3. Add dedicated exception-filter specs for Prisma/global filter mappings.
4. Add one full-path E2E scenario from creation to pallet registration to purge-block behavior.

## Conventions Used

- Test file naming:
  - unit/service/guard/policy tests: `*.spec.ts` in `src/`
  - real E2E tests: `*.e2e-spec.ts` in `test/`
- HTTP assertions via `supertest`
- Test DB setup with `prisma db push` before real E2E execution
