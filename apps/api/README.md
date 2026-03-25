# Monito API

Backend NestJS per il sistema di tracciabilità.

## Setup Locale

```bash
# Installa dipendenze dalla root del monorepo
pnpm install

# Copia le variabili ambiente
cp .env.example .env

# Avvia Redis (obbligatorio per token blacklist)
docker-compose up -d

# Avvia il server di sviluppo
pnpm run dev
```

Il server sarà disponibile su `http://localhost:3000/api/v1`

## Database

### Sviluppo (SQLite)

Il database SQLite viene creato automaticamente in `prisma/dev.db`.

```bash
# Reset database (perde tutti i dati)
pnpm prisma migrate reset --force

# Crea nuova migrazione
pnpm prisma migrate dev --name <nome-migrazione>

# Apri Prisma Studio
pnpm prisma studio
```

### Produzione (PostgreSQL)

Aggiorna la variabile `DATABASE_URL` nel file `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/monito?schema=public"
```

Esegui le migrazioni:

```bash
pnpm prisma migrate deploy
```

## Seed Dati

Per creare l'utente admin:

```bash
pnpm tsx src/seed.ts
```

## Test

```bash
# Unit tests
pnpm test

# Unit tests con watch
pnpm test:watch

# Coverage
pnpm test:cov
```

### Coverage Minima

- Services: **70%**
- Controllers: **70%**

## Build

```bash
# Build di produzione
pnpm build

# Avvia in produzione
pnpm start:prod
```

## Struttura Code

```
src/
├── modules/
│   ├── auth/           # Autenticazione JWT
│   ├── users/          # Gestione utenti
│   ├── products/       # Prodotti agricoli
│   ├── varieties/      # Varietà prodotti
│   ├── field-lots/     # Lotti campo
│   ├── processed-products/  # Prodotti lavorati
│   ├── packagings/    # Imballaggi
│   ├── pallets/       # Gestione pallet
│   └── audit/         # Log audit
├── common/
│   ├── decorators/    # @CurrentUser, @Public
│   ├── dto/           # DTO condivisi
│   ├── filters/       # Exception filters
│   ├── interceptors/  # Response transformers
│   └── events/        # Audit queue
├── config/            # Configurazione app
└── prisma/           # Prisma service
```

## Validazione

Tutti gli input sono validati con `class-validator`:

- **Codici**: max 32 char, solo lettere e numeri
- **Nomi**: max 100 char
- **EAN**: esattamente 13 cifre
- **Password**: minimo 6 caratteri

## Security

- Helmet.js per headers HTTP
- Rate limiting (10 richieste/minuto)
- JWT con refresh token
- Token blacklist su Redis
- Validazione input whitelist
- CORS configurabile

## Troubleshooting

### Redis non disponibile
Il server funziona anche senza Redis, ma il logout non revoca i token.

### Errore "Module not found"
```bash
pnpm prisma generate
```

### Errore migrazioni
```bash
pnpm prisma migrate reset --force
pnpm prisma generate
```
