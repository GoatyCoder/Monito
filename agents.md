# AGENTS.md

Regole operative per agenti AI che operano su questo repository.

---

## Contesto
- **Tipo**: Backoffice tracciabilità agricola
- **Stack**: NestJS + React + TypeScript + Prisma
- **Package manager**: `pnpm` (mai npm/yarn)

---

## Comandi

### Backend
```bash
cd apps/api
pnpm run dev              # Dev server (watch mode)
pnpm run build            # Build production
pnpm run test             # Tutti i test
pnpm run test:e2e         # E2E suite
pnpm run test -- src/modules/users/users.service.spec.ts  # File singolo
pnpm run test -- --testNamePattern="UsersService.create" # Per nome
pnpm run test:watch       # Watch mode
pnpm run test:cov         # Con coverage
pnpm run lint             # Lint + fix automatico
pnpm run check:all        # Quality gate completo
```

### Frontend
```bash
cd apps/web
pnpm run dev              # Dev server (porta 5173)
pnpm run build            # Build production
pnpm run typecheck        # TypeScript check
pnpm run lint             # Lint + fix
```

---

## Stile codice

### Prettier config
```json
{ "semi": true, "singleQuote": true, "printWidth": 100, "tabWidth": 2 }
```

### Import order (Backend)
1. `@nestjs/*` 2. Esterne 3. Prisma 4. Relativi 5. DTOs

### Naming
| Tipo | Convention | Esempio |
|------|------------|---------|
| Componenti | PascalCase | `ProductsPage` |
| Hooks | use* | `useProducts` |
| File | kebab-case | `products-page.tsx` |
| Types | PascalCase | `UserResponseDto` |

### Error handling
- Backend: usa `HttpException` (NotFoundException, ConflictException)
- Frontend: try/catch con `showError()` da `@/lib/toast`

#### Standard errori API (obbligatorio)
- Le risposte errore devono includere sempre `code` stabile (machine-readable)
- Contratto errore: `{ statusCode, code, message, error, timestamp, path, requestId, details? }`
- Backend:
  - usa i codici centralizzati in `apps/api/src/common/errors/error-codes.ts`
  - quando lanci eccezioni dominio, passa `{ code, message }` nel payload della `HttpException`
  - non usare il testo `message` come contratto per il frontend
- Frontend:
  - non fare mapping hardcoded da messaggi inglesi
  - usa `getApiErrorMessage()` / `translateErrorCode()` in `apps/web/src/lib/error-utils.ts` e `apps/web/src/lib/error-messages.ts`
  - `message` e solo fallback, `code` e la fonte primaria per UX/localizzazione

---

## Cosa NON fare
- ❌ Logica business nei controller
- ❌ `console.log` in produzione
- ❌ `ParseUUIDPipe` per CUID (usa `@IsString()`)
- ❌ `new PrismaClient()` — usa DI con `PrismaService`
- ❌ SQL raw senza sanitizzazione
- ❌ Ignorare type error

---

## Backend (NestJS)

### Regole
- API REST: risorse plurali, formato `{ data }` (dettaglio) e `{ data, meta }` (liste)
- Prisma: typed queries, no `$queryRaw`
- Auth: `JwtAuthGuard` globale, `@Public()` per pubbliche
- CUID per IDs, non UUID
- Verifica duplicati prima di creare
- Soft delete come default, restore e purge espliciti
- Endpoints active/trash separati (no `includeDeleted`)
- Purge con reason obbligatoria e blocco su referenze attive
- Ruoli: `ADMIN` write, `OPERATOR` read-only sui moduli operativi

### Operability
- Health probes pubbliche:
  - `GET /api/v1/health/liveness`
  - `GET /api/v1/health/readiness`
- Header `x-request-id` su ogni request
- Logging strutturato HTTP con requestId
- Shutdown hooks abilitati

### Struttura
```
modules/<modulo>/
├── dto/           # create-*.dto.ts, update-*.dto.ts
├── <modulo>.controller.ts
├── <modulo>.service.ts
└── <modulo>.module.ts
```

---

## Frontend (React)

### Regole
- TanStack Router: routing type-safe
- TanStack Query: server state con `useQuery`/`useMutation`
- shadcn/ui: componenti in `components/ui/`
- Form: React Hook Form + Zod validation

### Pattern CRUD
```typescript
// hooks/use-products.ts
export function useProducts(filters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => api.get('/products', { params: filters }).then(r => r.data),
  });
}
```

### Struttura
```
apps/web/src/
├── components/ui/      # Button, Input, Dialog, Table
├── components/layout/  # Sidebar, AppLayout
├── contexts/           # AuthContext
├── hooks/              # useProducts, useCreateProduct
├── lib/                # api.ts, utils.ts, toast.ts
└── pages/             # login-page.tsx, products-page.tsx
```

---

## Accessibilità (WCAG 2.1 AA)

- Skip link (`<a href="#main-content">`)
- aria-label su bottoni senza testo
- aria-describedby per errori form
- scope="col" + aria-sort in tabelle
- aria-busy per loading
- lang="it" in HTML

---

## Checklist PR

### Backend
- [ ] TypeScript compila
- [ ] Test passano
- [ ] Nessun console.log
- [ ] `pnpm run check:all` verde
- [ ] Migrazione Prisma inclusa se cambia lo schema
- [ ] Contratti API allineati (active/trash + restore/purge)

### Frontend  
- [ ] TypeScript compila (`pnpm run typecheck`)
- [ ] Form con Zod validation
- [ ] Loading states + toast feedback
- [ ] Skip link presente
- [ ] aria-label su icon button
