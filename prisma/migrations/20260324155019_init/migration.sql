-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "refreshToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "varieties" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "productId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "varieties_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "field_lots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lotCode" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "varietyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "field_lots_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "varieties" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "processed_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ean" TEXT,
    "weightPerBoxKg" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "packagings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "pallets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "palletNumber" TEXT NOT NULL,
    "netWeightKg" REAL NOT NULL,
    "fieldLotId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "pallets_fieldLotId_fkey" FOREIGN KEY ("fieldLotId") REFERENCES "field_lots" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pallet_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL,
    "palletId" TEXT NOT NULL,
    "processedProductId" TEXT NOT NULL,
    "packagingId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pallet_items_palletId_fkey" FOREIGN KEY ("palletId") REFERENCES "pallets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pallet_items_processedProductId_fkey" FOREIGN KEY ("processedProductId") REFERENCES "processed_products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pallet_items_packagingId_fkey" FOREIGN KEY ("packagingId") REFERENCES "packagings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "daily_pallet_counters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lastNumber" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");

-- CreateIndex
CREATE UNIQUE INDEX "varieties_code_key" ON "varieties"("code");

-- CreateIndex
CREATE UNIQUE INDEX "field_lots_lotCode_key" ON "field_lots"("lotCode");

-- CreateIndex
CREATE UNIQUE INDEX "processed_products_code_key" ON "processed_products"("code");

-- CreateIndex
CREATE UNIQUE INDEX "processed_products_ean_key" ON "processed_products"("ean");

-- CreateIndex
CREATE UNIQUE INDEX "packagings_code_key" ON "packagings"("code");

-- CreateIndex
CREATE UNIQUE INDEX "pallets_palletNumber_key" ON "pallets"("palletNumber");
