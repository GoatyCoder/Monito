-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_packagings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tareKg" DECIMAL,
    "outerLengthMm" INTEGER,
    "outerWidthMm" INTEGER,
    "outerHeightMm" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);
INSERT INTO "new_packagings" ("code", "createdAt", "deletedAt", "description", "id", "name", "outerHeightMm", "outerLengthMm", "outerWidthMm", "tareKg", "updatedAt") SELECT "code", "createdAt", "deletedAt", "description", "id", "name", "outerHeightMm", "outerLengthMm", "outerWidthMm", "tareKg", "updatedAt" FROM "packagings";
DROP TABLE "packagings";
ALTER TABLE "new_packagings" RENAME TO "packagings";
CREATE UNIQUE INDEX "packagings_code_key" ON "packagings"("code");
CREATE INDEX "packagings_deletedAt_idx" ON "packagings"("deletedAt");
CREATE INDEX "packagings_createdAt_idx" ON "packagings"("createdAt");
CREATE TABLE "new_pallet_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL,
    "weightKg" DECIMAL NOT NULL,
    "palletId" TEXT NOT NULL,
    "processedProductId" TEXT NOT NULL,
    "packagingId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pallet_items_palletId_fkey" FOREIGN KEY ("palletId") REFERENCES "pallets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pallet_items_processedProductId_fkey" FOREIGN KEY ("processedProductId") REFERENCES "processed_products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pallet_items_packagingId_fkey" FOREIGN KEY ("packagingId") REFERENCES "packagings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_pallet_items" ("createdAt", "id", "packagingId", "palletId", "processedProductId", "quantity", "weightKg") SELECT "createdAt", "id", "packagingId", "palletId", "processedProductId", "quantity", "weightKg" FROM "pallet_items";
DROP TABLE "pallet_items";
ALTER TABLE "new_pallet_items" RENAME TO "pallet_items";
CREATE INDEX "pallet_items_palletId_idx" ON "pallet_items"("palletId");
CREATE INDEX "pallet_items_processedProductId_idx" ON "pallet_items"("processedProductId");
CREATE INDEX "pallet_items_packagingId_idx" ON "pallet_items"("packagingId");
CREATE TABLE "new_pallets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "palletNumber" TEXT NOT NULL,
    "netWeightKg" DECIMAL NOT NULL,
    "fieldLotId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "pallets_fieldLotId_fkey" FOREIGN KEY ("fieldLotId") REFERENCES "field_lots" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_pallets" ("createdAt", "createdBy", "deletedAt", "fieldLotId", "id", "netWeightKg", "palletNumber", "updatedAt") SELECT "createdAt", "createdBy", "deletedAt", "fieldLotId", "id", "netWeightKg", "palletNumber", "updatedAt" FROM "pallets";
DROP TABLE "pallets";
ALTER TABLE "new_pallets" RENAME TO "pallets";
CREATE UNIQUE INDEX "pallets_palletNumber_key" ON "pallets"("palletNumber");
CREATE INDEX "pallets_deletedAt_idx" ON "pallets"("deletedAt");
CREATE INDEX "pallets_fieldLotId_deletedAt_idx" ON "pallets"("fieldLotId", "deletedAt");
CREATE INDEX "pallets_createdBy_idx" ON "pallets"("createdBy");
CREATE INDEX "pallets_createdAt_idx" ON "pallets"("createdAt");
CREATE TABLE "new_processed_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ean" TEXT,
    "weightPerBoxKg" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);
INSERT INTO "new_processed_products" ("code", "createdAt", "deletedAt", "description", "ean", "id", "name", "updatedAt", "weightPerBoxKg") SELECT "code", "createdAt", "deletedAt", "description", "ean", "id", "name", "updatedAt", "weightPerBoxKg" FROM "processed_products";
DROP TABLE "processed_products";
ALTER TABLE "new_processed_products" RENAME TO "processed_products";
CREATE UNIQUE INDEX "processed_products_code_key" ON "processed_products"("code");
CREATE UNIQUE INDEX "processed_products_ean_key" ON "processed_products"("ean");
CREATE INDEX "processed_products_deletedAt_idx" ON "processed_products"("deletedAt");
CREATE INDEX "processed_products_createdAt_idx" ON "processed_products"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
