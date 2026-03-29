# ProductSubtype & Vincoli Lavorati (Spec + Piano Operativo)

Data: 2026-03-27
Stato: approvato per implementazione

## 1. Obiettivo

Ridefinire il dominio anagrafiche/tracciabilita per supportare:

- sotto-tipologie di prodotto (`ProductSubtype`),
- assegnazione opzionale della varieta a un subtype,
- vincoli configurabili sui lavorati (`ProcessedProduct`) su tre livelli: prodotto, subtype, varieta,
- validazione runtime in creazione pallet con logica OR globale,
- retrocompatibilita (lavorati senza vincoli validi globalmente).

## 2. Vincoli di progetto (obbligatori)

Allineamento a:

- `AGENTS.md`
- `apps/api/docs/index.md`

Regole chiave applicate:

- package manager: `pnpm`
- pattern API NestJS esistente (`{ data }`, `{ data, meta }`, active/trash/restore/purge)
- business logic nei service, non nei controller
- soft-delete come default
- validazione DTO + Swagger
- no rotture non necessarie ai contratti esistenti

## 3. Decisioni di dominio approvate

1. Nuovo modello: `ProductSubtype`.
2. Unicita codice locale al prodotto:
   - `ProductSubtype`: `@@unique([productId, code])`
   - `Variety`: `@@unique([productId, code])` (non globale)
3. Una varieta puo avere `productSubtypeId` opzionale (o nessuno).
4. Un lavorato puo avere piu vincoli contemporanei.
5. Matching vincoli: OR globale.

Semantica OR globale:

- nessun vincolo configurato => lavorato consentito sempre;
- con vincoli => consentito se matcha almeno uno tra prodotto/subtype/varieta.

## 4. Modello dati (Prisma)

### 4.1 Nuovo modello `ProductSubtype`

- `id String @id @default(cuid())`
- `productId String`
- `code String` (input max 14, coerente con anagrafiche code)
- `name String`
- `description String?`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`
- `deletedAt DateTime?`

Relazioni:

- `product Product @relation(fields: [productId], references: [id], onDelete: Restrict)`
- `varieties Variety[]`

Vincoli/indici:

- `@@unique([productId, code])`
- `@@index([productId, deletedAt])`
- `@@index([deletedAt])`

### 4.2 Aggiornamento `Variety`

- nuovo campo: `productSubtypeId String?`
- relazione opzionale:
  - `productSubtype ProductSubtype? @relation(fields: [productSubtypeId], references: [id], onDelete: SetNull)`
- unicita codice:
  - rimuovere `code @unique` globale
  - aggiungere `@@unique([productId, code])`

Regola applicativa: se `productSubtypeId` e presente, deve riferire subtype dello stesso `productId`.

### 4.3 Join table vincoli lavorato

1. `ProcessedProductAllowedProduct`
   - `processedProductId`, `productId`
   - `@@unique([processedProductId, productId])`

2. `ProcessedProductAllowedSubtype`
   - `processedProductId`, `productSubtypeId`
   - `@@unique([processedProductId, productSubtypeId])`

3. `ProcessedProductAllowedVariety`
   - `processedProductId`, `varietyId`
   - `@@unique([processedProductId, varietyId])`

Con indici su FK e cleanup coerente con soft-delete strategy applicativa.

## 5. API e comportamento backend

### 5.1 Nuovo modulo `product-subtypes`

Pattern identico alle anagrafiche esistenti:

- active list/detail
- trash list/detail
- create/update
- restore/purge (con reason su purge)
- endpoint lookup `GET /product-subtypes/all`
- endpoint nested consigliato: `GET /products/:productId/subtypes/all`

### 5.2 Estensione `varieties`

- `create/update` accetta `productSubtypeId?: string | null`
- validazione coerenza prodotto/subtype
- response include `productSubtypeId` (+ opzionale dato subtype minimale se gia usato nei DTO)

### 5.3 Estensione `processed-products`

Create/Update DTO:

- `allowedProductIds?: string[]`
- `allowedSubtypeIds?: string[]`
- `allowedVarietyIds?: string[]`

Response DTO:

- i tre array di vincolo (sempre presenti, default `[]`)

### 5.4 Validazione in `PalletsService.create`

Per ogni item:

1. ricavare da `FieldLot -> Variety`: `productId`, `productSubtypeId`, `varietyId`
2. leggere i vincoli del `processedProduct`
3. applicare OR globale
4. su mismatch: `BadRequestException` con messaggio chiaro

## 6. Compatibilita e migrazione

- migrazione non distruttiva (nuovi oggetti + modifica unique varieta)
- nessun backfill obbligatorio
- lavorati esistenti senza vincoli restano validi globalmente
- attenzione integrazioni: `variety.code` non e piu chiave globale

## 7. Testing richiesto

## 7.1 Test regola unicita (obbligatori)

- `ProductSubtype`
  - stesso `code` + stesso `productId` => errore
  - stesso `code` + `productId` diverso => consentito
- `Variety`
  - stesso `code` + stesso `productId` => errore
  - stesso `code` + `productId` diverso => consentito

## 7.2 Test dominio vincoli

- nessun vincolo => consentito
- match prodotto => consentito
- match subtype => consentito
- match varieta => consentito
- nessun match => rifiutato

## 7.3 Test coerenza subtype-variety

- subtype di prodotto diverso in create/update variety => errore
- subtype nullo => consentito

## 8. Documentazione da aggiornare

- `apps/api/README.md`
- `apps/api/docs/reference/api-endpoints.md`
- `apps/api/docs/reference/database-schema.md`
- `apps/api/docs/how-to/operations.md`
- `FRONTEND.md`

Nota esplicita da includere:

- codici `ProductSubtype` e `Variety` univoci per prodotto, non globali.

## 9. Piano operativo task-by-task

1. **Schema Prisma**
   - aggiunta `ProductSubtype`
   - update `Variety` (`productSubtypeId`, unique composita)
   - aggiunta join table vincoli lavorato
   - migration

2. **Backend product-subtypes module**
   - scaffold modulo/dto/controller/service/spec
   - endpoint active/trash/restore/purge/all
   - audit e regole duplicate/soft-delete

3. **Backend varieties update**
   - DTO + service validation subtype-product alignment
   - response mapping
   - test dedicati

4. **Backend processed-products update**
   - DTO vincoli
   - persistenza join tables in create/update
   - response enrichment
   - test dedicati

5. **Backend pallets validation**
   - OR globale in create pallet
   - error handling esplicito
   - test dedicati

6. **Frontend update**
   - UI/CRUD subtype
   - variety form subtype opzionale
   - processed-product form vincoli multipli
   - adattamento flusso pallet

7. **Documentazione**
   - aggiornare tutti i file indicati al punto 8

8. **Quality gate finale**
   - API: `pnpm run check:all`
   - Web: `pnpm run typecheck && pnpm run lint && pnpm run build`

## 10. Acceptance criteria

- il dominio rappresenta subtype e vincoli multipli come da esempi reali
- la regola OR globale e applicata in modo consistente
- i test coprono esplicitamente la regola di unicita per prodotto
- nessuna regressione sui flussi esistenti
- documentazione aggiornata e coerente
