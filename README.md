# Monito - Backend

Backend API per il sistema di tracciabilità dei prodotti agricoli.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
cd apps/api && pnpm run dev

# Start Redis (required for token blacklist)
docker-compose up -d
```

## Requisiti

- Node.js 20+
- pnpm 8+
- Docker + Docker Compose (per Redis)
- SQLite (sviluppo) / PostgreSQL (produzione)

## Stack Tecnologico

| Tecnologia | Versione | Note |
|------------|----------|------|
| NestJS | ^11 | Framework principale |
| TypeScript | ^5.5 | strict mode |
| Prisma | ^7.5 | ORM |
| SQLite | - | Sviluppo |
| PostgreSQL | 15+ | Produzione |
| Passport.js | latest | Auth JWT |
| Redis | 7+ | Token blacklist |

## Struttura Progetto

```
apps/
├── api/                 # Backend NestJS
│   ├── src/
│   │   ├── modules/    # Feature modules
│   │   ├── common/     # Shared components
│   │   ├── config/     # Configuration
│   │   └── prisma/    # Database
│   └── prisma/         # Schema & migrations
```

## Comandi Utili

```bash
# Sviluppo
pnpm run dev              # Avvia server con hot-reload

# Build
pnpm build               # Compila per produzione
pnpm start               # Avvia server production

# Database
pnpm prisma migrate dev  # Crea migrazione
pnpm prisma generate     # Genera client
pnpm prisma studio       # GUI database

# Test
pnpm test                # Unit tests
pnpm test:cov            # Coverage report

# Linting
pnpm lint                # Fix automatico
```

## Variabili Ambiente

Vedi `.env.example` per le variabili richieste.

## API Documentation

Swagger disponibile su: `http://localhost:3000/api/v1/docs`

### Autenticazione

```
POST /api/v1/auth/login      - Login (username + password)
POST /api/v1/auth/refresh    - Refresh token
POST /api/v1/auth/logout     - Logout (revoca token)
```

### Risorse

```
GET    /api/v1/users              - Lista utenti
POST   /api/v1/users              - Crea utente
GET    /api/v1/users/:id           - Dettaglio utente
PATCH  /api/v1/users/:id          - Modifica utente
DELETE /api/v1/users/:id          - Elimina utente

GET    /api/v1/products            - Lista prodotti
POST   /api/v1/products           - Crea prodotto
GET    /api/v1/products/:id        - Dettaglio prodotto
PATCH  /api/v1/products/:id       - Modifica prodotto
DELETE /api/v1/products/:id      - Elimina (soft delete)
POST   /api/v1/products/:id/restore - Ripristina

GET    /api/v1/varieties          - Lista varietà
POST   /api/v1/varieties          - Crea varietà
GET    /api/v1/varieties/:id      - Dettaglio varietà
PATCH  /api/v1/varieties/:id      - Modifica varietà
DELETE /api/v1/varieties/:id      - Elimina (soft delete)
POST   /api/v1/varieties/:id/restore - Ripristina

GET    /api/v1/field-lots         - Lista lotti
POST   /api/v1/field-lots        - Crea lotto
GET    /api/v1/field-lots/:id     - Dettaglio lotto
PATCH  /api/v1/field-lots/:id     - Modifica lotto
DELETE /api/v1/field-lots/:id    - Elimina (soft delete)

GET    /api/v1/processed-products  - Lista prodotti lavorati
POST   /api/v1/processed-products - Crea prodotto lavorato
GET    /api/v1/processed-products/:id - Dettaglio
PATCH  /api/v1/processed-products/:id - Modifica
DELETE /api/v1/processed-products/:id - Elimina (soft)

GET    /api/v1/packagings         - Lista imballaggi
POST   /api/v1/packagings         - Crea imballaggio
GET    /api/v1/packagings/:id     - Dettaglio imballaggio
PATCH  /api/v1/packagings/:id     - Modifica imballaggio
DELETE /api/v1/packagings/:id     - Elimina (soft delete)

GET    /api/v1/pallets            - Lista pallet
POST   /api/v1/pallets           - Crea pallet
GET    /api/v1/pallets/by-number/:palletNumber - Trova per numero
GET    /api/v1/pallets/:id        - Dettaglio pallet
PATCH  /api/v1/pallets/:id        - Modifica pallet
DELETE /api/v1/pallets/:id        - Elimina (soft delete)
DELETE /api/v1/pallets/:id?force=true - Elimina definitiva
POST   /api/v1/pallets/:id/restore - Ripristina

GET    /api/v1/audit              - Log audit
GET    /api/v1/audit/entity/:entity/:entityId - Audit per entità
GET    /api/v1/audit/user/:userId - Audit per utente
```

## Utente Default

```
Username: admin
Password: admin123
```

## Produzione

```bash
# Build
pnpm build

# Database PostgreSQL richiesto
# Aggiornare DATABASE_URL in .env
```

## License

Internal use only.
