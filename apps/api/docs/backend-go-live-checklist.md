# Backend Go-Live Checklist

Use this checklist before every production release of `apps/api`.

## 1) Quality Gate

- [ ] Run full checks:

```bash
pnpm run check:all
```

- [ ] Verify latest migration is applied in target environment.
- [ ] Verify no local-only config values are baked into build artifacts.

## 2) Security and Auth

- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are set and strong.
- [ ] Redis is reachable in production (required for refresh token revocation).
- [ ] Role matrix validated (`ADMIN` write, `OPERATOR` read-only).
- [ ] Sensitive logs (tokens, passwords, secrets) are not present.

## 3) API Contract Consistency

- [ ] Active vs trash endpoints are separated (`/resource`, `/resource/deleted`).
- [ ] Soft delete / restore / purge flow is consistent across modules.
- [ ] Purge requires `reason` and respects referential constraints.
- [ ] Response envelopes are consistent:
  - list: `{ data, meta }`
  - detail: `{ data }`

## 4) Database and Migrations

- [ ] Database backup completed.
- [ ] Migration SQL reviewed and approved.
- [ ] Prisma client regenerated in CI/CD build.
- [ ] Indexes and relation constraints are present in target DB.

## 5) Operability

- [ ] Health probes available:
  - `GET /api/v1/health/liveness`
  - `GET /api/v1/health/readiness`
- [ ] Request ID propagation is active (`x-request-id`).
- [ ] Structured request logs are visible in runtime logs.
- [ ] Graceful shutdown behavior verified during rolling restart.

## 6) Documentation

- [ ] Swagger is reachable in non-production environments.
- [ ] Endpoint docs and status codes reflect actual behavior.
- [ ] Testing docs updated when test strategy changes.
