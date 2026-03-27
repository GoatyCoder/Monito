# Reference: Database Schema

Schema sorgente: `apps/api/prisma/schema.prisma`

Provider attuale: `sqlite`.

Questo documento descrive lo stato reale corrente del backend. PostgreSQL non e configurato nel datasource attuale.

## Entita principali

- `User`
  - identificazione utente backend
  - ruoli: `USER`, `OPERATOR`, `ADMIN`
- `Product`
- `ProductSubtype` (relazione con `Product`)
- `Variety` (relazione con `Product`)
- `FieldLot` (relazione con `Variety`)
- `ProcessedProduct`
- `ProcessedProductAllowedProduct`
- `ProcessedProductAllowedSubtype`
- `ProcessedProductAllowedVariety`
- `Packaging`
- `Pallet` (relazione con `FieldLot`)
- `PalletItem` (relazione con `Pallet`, `ProcessedProduct`, `Packaging`)
- `DailyPalletCounter`
- `AuditLog`

## Catena dominio tracciabilita

`Product -> ProductSubtype -> Variety -> FieldLot -> Pallet -> PalletItem`

Ogni `PalletItem` collega un `ProcessedProduct` e un `Packaging`.
I vincoli lavorato opzionali sono modellati con tre join table (product/subtype/variety) con semantica OR globale.

## Soft delete

Le seguenti entita usano soft delete (`deletedAt`):

- `Product`
- `ProductSubtype`
- `Variety`
- `FieldLot`
- `ProcessedProduct`
- `Packaging`
- `Pallet`

## Vincoli relazionali principali

- `Variety.productId` -> `Product.id` (`onDelete: Restrict`)
- `ProductSubtype.productId` -> `Product.id` (`onDelete: Restrict`)
- `Variety.productSubtypeId` -> `ProductSubtype.id` (`onDelete: SetNull`)
- `FieldLot.varietyId` -> `Variety.id` (`onDelete: Restrict`)
- `ProcessedProductAllowedProduct.processedProductId` -> `ProcessedProduct.id` (`onDelete: Cascade`)
- `ProcessedProductAllowedProduct.productId` -> `Product.id` (`onDelete: Restrict`)
- `ProcessedProductAllowedSubtype.processedProductId` -> `ProcessedProduct.id` (`onDelete: Cascade`)
- `ProcessedProductAllowedSubtype.productSubtypeId` -> `ProductSubtype.id` (`onDelete: Restrict`)
- `ProcessedProductAllowedVariety.processedProductId` -> `ProcessedProduct.id` (`onDelete: Cascade`)
- `ProcessedProductAllowedVariety.varietyId` -> `Variety.id` (`onDelete: Restrict`)
- `Pallet.fieldLotId` -> `FieldLot.id` (`onDelete: Restrict`)
- `PalletItem.palletId` -> `Pallet.id` (`onDelete: Cascade`)
- `PalletItem.processedProductId` -> `ProcessedProduct.id` (`onDelete: Restrict`)
- `PalletItem.packagingId` -> `Packaging.id` (`onDelete: Restrict`)

## Unicita

- `User.username`
- `Product.code`
- `ProductSubtype.(productId, code)`
- `Variety.(productId, code)`
- `FieldLot.lotCode`
- `ProcessedProduct.code`
- `ProcessedProduct.ean` (nullable, unique quando valorizzato)
- `Packaging.code`
- `Pallet.palletNumber`
- `DailyPalletCounter.id`
- `ProcessedProductAllowedProduct.(processedProductId, productId)`
- `ProcessedProductAllowedSubtype.(processedProductId, productSubtypeId)`
- `ProcessedProductAllowedVariety.(processedProductId, varietyId)`

## Policy codici e soft delete

Per le entita con campo `code` (`Product`, `ProductSubtype`, `Variety`, `ProcessedProduct`, `Packaging`):

- l'applicazione valida input utente con max `14` caratteri alfanumerici
- in soft delete il service rinomina il codice in formato `_del_<timestamp>`
- la rinomina e troncata in modo da rispettare il vincolo logico di lunghezza `32`
- in restore viene tentato il ripristino del codice originale; se gia occupato da record attivo, viene restituito `409`

Nota unicita locale:

- `ProductSubtype.code` e `Variety.code` non sono globalmente unici: sono unici nel perimetro dello stesso `productId`.

## Indici funzionali

Indici aggiunti per query frequenti:

- `deletedAt` su tutte le tabelle soft-delete
- `createdAt` su risorse listabili
- FK composte con `deletedAt` su catena dominio
- `AuditLog` su `(entity, entityId)`, `userId`, `timestamp`, `(operation, timestamp)`

## Migrazioni

Le migrazioni si trovano in: `apps/api/prisma/migrations/`.

Migrazione rilevante di hardening persistence:

- `20260326162951_phase3_persistence_indexes`
