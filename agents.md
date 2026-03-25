# agents.md

Questo file definisce le regole operative per qualsiasi agente AI (Claude, Cursor, Copilot, ecc.)
che lavora su questo repository. **Leggi e rispetta sempre queste istruzioni prima di generare codice.**

---

## Contesto del progetto

- **Tipo**: Strumento interno / backoffice
- **Team**: ~decine di utenti interni
- **Fase attuale**: Focus su backend e API REST

---

## Stack tecnologico

### Backend
| Tecnologia | Versione | Note |
|---|---|---|
| NestJS | ^11 | Framework principale |
| TypeScript | ^5.5 | strict mode obbligatorio |
| Prisma | ^7.5 | ORM — usa sempre le typed queries |
| SQLite | dev/test | PostgreSQL in produzione |
| Passport.js | latest | Auth strategy |
| JWT | latest | Access + Refresh token |
| ioredis | latest | Client Redis per caching |
| class-validator | latest | Validazione DTO |
| class-transformer | latest | Serializzazione |
| Swagger | @nestjs/swagger | Documentazione API |

### Frontend
| Tecnologia | Versione | Note |
|---|---|---|
| React | ^19 | |
| TypeScript | ^5.5 | strict mode |
| TanStack Router | latest | Routing type-safe |
| TanStack Query | latest | Server state management |
| shadcn/ui | latest | Component library |
| Tailwind CSS | ^4 | |

### Tooling
- **Package manager**: `pnpm` — non usare mai `npm` o `yarn`
- **Linter**: ESLint (config condivisa nel monorepo)
- **Formatter**: Prettier (config a radice)
- **Git hooks**: Husky + lint-staged
- **Container**: Docker + docker-compose

---

## Regole generali per gli agenti

### 1. TypeScript
- Usa sempre `strict: true` — nessun `any` implicito
- Non usare `as any` o `// @ts-ignore` senza commento motivazionale
- Preferisci `interface` per i contratti pubblici, `type` per le unioni/intersezioni
- Esporta sempre i tipi che potrebbero essere riusati

### 2. Struttura file NestJS
Segui sempre la struttura a moduli di NestJS:
```
src/
  modules/
    <nome-modulo>/
      dto/
        create-<nome>.dto.ts
        update-<nome>.dto.ts
      entities/
        <nome>.entity.ts       # solo se necessario (di solito usa i Prisma types)
      <nome>.controller.ts
      <nome>.service.ts
      <nome>.module.ts
  common/
    decorators/
    filters/
    guards/
    interceptors/
    pipes/
  config/
  prisma/
    prisma.service.ts
    prisma.module.ts
  app.module.ts
  main.ts
```

### 3. Prisma
- **Non usare `prisma.$queryRaw`** salvo query estremamente complesse, e solo con parametri escaped
- Usa sempre le typed relations — non fare join manuali
- Le migration vanno create con `pnpm prisma migrate dev --name <nome-descrittivo>`
- Lo schema si trova in `prisma/schema.prisma`
- Ogni modifica allo schema deve essere accompagnata dalla relativa migration
- Usa `prisma.$transaction` per operazioni multi-step

### 4. API REST
- Segui le convenzioni REST: risorse al plurale, verbi HTTP corretti
- Ogni endpoint deve avere i decoratori `@ApiOperation`, `@ApiResponse` di Swagger
- Usa sempre i DTO con class-validator per input e output
- Restituisci sempre un formato di risposta coerente:
  ```json
  // Successo lista
  { "data": [...], "meta": { "total": 0, "page": 1, "limit": 20 } }
  // Successo singolo
  { "data": { ... } }
  // Errore
  { "statusCode": 400, "message": "...", "error": "Bad Request" }
  ```

### 5. Autenticazione & Autorizzazione
- Usa `JwtAuthGuard` come guard globale — le rotte pubbliche vanno decorate con `@Public()`
- Non mettere mai logica di autorizzazione nei controller: usa guard o policy
- I token JWT **non vanno mai loggati**
- Usa sempre bcrypt con `saltRounds >= 12` per hashing password
- Refresh token: ruota ad ogni utilizzo (rotation strategy)

### 6. Caching Redis
- Usa il `CacheModule` di NestJS wrappato su ioredis
- Definisci le cache key in costanti, mai stringhe inline:
  ```ts
  // ✅
  const CACHE_KEY = `user:${userId}:profile`;
  // ❌
  cache.get(`user_${id}`);
  ```
- Imposta sempre un TTL esplicito
- Invalida la cache nelle operazioni di scrittura (POST/PUT/PATCH/DELETE)

### 7. Error handling
- Usa le eccezioni built-in di NestJS (`NotFoundException`, `BadRequestException`, ecc.)
- Non fare mai `throw new Error(...)` nei service — usa le HttpException di Nest
- Registra un `GlobalExceptionFilter` in `main.ts`
- Non esporre stack trace in produzione

### 8. Test
- Ogni service **deve** avere il suo file `.spec.ts`
- Usa `@nestjs/testing` e mock Prisma con `jest.mock` o `prisma-mock`
- I test di integrazione (e2e) usano SQLite in memoria
- Coverage minima: **70%** su service e controller

### 9. Sicurezza
- Abilita Helmet in `main.ts`
- Abilita CORS con whitelist esplicita
- Rate limiting su tutte le rotte auth (`@nestjs/throttler`)
- Non committare mai `.env` — usa `.env.example` come riferimento
- Valida e sanitizza sempre l'input con class-validator (nessun bypass)

### 10. Logging
- Usa il `Logger` di NestJS (non `console.log`)
- Non loggare mai dati sensibili (password, token, PII)
- In produzione il log level sarà `warn` o `error`

---

## Comandi frequenti

```bash
# Avvio dev
pnpm run start:dev

# Prisma
pnpm prisma migrate dev --name <nome>
pnpm prisma generate
pnpm prisma studio

# Test
pnpm test
pnpm test:e2e
pnpm test:cov

# Build
pnpm build

# Docker
docker-compose up -d
docker-compose down
```

---

## Cosa NON fare (mai)

- ❌ Scrivere logica di business nei controller
- ❌ Accedere a Prisma direttamente dai controller (passa sempre per il service)
- ❌ Usare `console.log` in produzione
- ❌ Hardcodare segreti o URL nel codice
- ❌ Ignorare i type error di TypeScript
- ❌ Fare commit senza che i test passino
- ❌ Usare `npm` o `yarn` invece di `pnpm`
- ❌ Scrivere SQL raw senza sanitizzazione
- ❌ Rimuovere validazioni "per velocità"
