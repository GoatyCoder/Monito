# Reference: Database Schema

Schema sorgente: `apps/api/prisma/schema.prisma`

Provider attuale: `sqlite`.

Questo documento descrive lo stato reale corrente del backend. PostgreSQL non e configurato nel datasource attuale.

## Entita principali

- `User`
  - identificazione utente backend
  - ruoli: `USER`, `OPERATOR`, `ADMIN`
- `Product`
- `Variety` (relazione con `Product`)
- `FieldLot` (relazione con `Variety`)
- `ProcessedProduct`
- `Packaging`
- `Pallet` (relazione con `FieldLot`)
- `PalletItem` (relazione con `Pallet`, `ProcessedProduct`, `Packaging`)
- `DailyPalletCounter`
- `AuditLog`

## Catena dominio tracciabilita

`Product -> Variety -> FieldLot -> Pallet -> PalletItem`

Ogni `PalletItem` collega un `ProcessedProduct` e un `Packaging`.

## Soft delete

Le seguenti entita usano soft delete (`deletedAt`):

- `Product`
- `Variety`
- `FieldLot`
- `ProcessedProduct`
- `Packaging`
- `Pallet`

## Vincoli relazionali principali

- `Variety.productId` -> `Product.id` (`onDelete: Restrict`)
- `FieldLot.varietyId` -> `Variety.id` (`onDelete: Restrict`)
- `Pallet.fieldLotId` -> `FieldLot.id` (`onDelete: Restrict`)
- `PalletItem.palletId` -> `Pallet.id` (`onDelete: Cascade`)
- `PalletItem.processedProductId` -> `ProcessedProduct.id` (`onDelete: Restrict`)
- `PalletItem.packagingId` -> `Packaging.id` (`onDelete: Restrict`)

## Unicita

- `User.username`
- `Product.code`
- `Variety.code`
- `FieldLot.lotCode`
- `ProcessedProduct.code`
- `ProcessedProduct.ean` (nullable, unique quando valorizzato)
- `Packaging.code`
- `Pallet.palletNumber`
- `DailyPalletCounter.id`

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
