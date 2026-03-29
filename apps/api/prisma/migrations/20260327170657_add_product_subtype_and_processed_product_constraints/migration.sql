-- CreateTable
CREATE TABLE "product_subtypes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "productId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "product_subtypes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "processed_product_allowed_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processedProductId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "processed_product_allowed_products_processedProductId_fkey" FOREIGN KEY ("processedProductId") REFERENCES "processed_products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "processed_product_allowed_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "processed_product_allowed_subtypes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processedProductId" TEXT NOT NULL,
    "productSubtypeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "processed_product_allowed_subtypes_processedProductId_fkey" FOREIGN KEY ("processedProductId") REFERENCES "processed_products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "processed_product_allowed_subtypes_productSubtypeId_fkey" FOREIGN KEY ("productSubtypeId") REFERENCES "product_subtypes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "processed_product_allowed_varieties" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processedProductId" TEXT NOT NULL,
    "varietyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "processed_product_allowed_varieties_processedProductId_fkey" FOREIGN KEY ("processedProductId") REFERENCES "processed_products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "processed_product_allowed_varieties_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "varieties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_varieties" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "productId" TEXT NOT NULL,
    "productSubtypeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "varieties_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "varieties_productSubtypeId_fkey" FOREIGN KEY ("productSubtypeId") REFERENCES "product_subtypes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_varieties" ("code", "createdAt", "deletedAt", "description", "id", "name", "productId", "updatedAt") SELECT "code", "createdAt", "deletedAt", "description", "id", "name", "productId", "updatedAt" FROM "varieties";
DROP TABLE "varieties";
ALTER TABLE "new_varieties" RENAME TO "varieties";
CREATE INDEX "varieties_productId_deletedAt_idx" ON "varieties"("productId", "deletedAt");
CREATE INDEX "varieties_productSubtypeId_deletedAt_idx" ON "varieties"("productSubtypeId", "deletedAt");
CREATE INDEX "varieties_deletedAt_idx" ON "varieties"("deletedAt");
CREATE UNIQUE INDEX "varieties_productId_code_key" ON "varieties"("productId", "code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "product_subtypes_productId_deletedAt_idx" ON "product_subtypes"("productId", "deletedAt");

-- CreateIndex
CREATE INDEX "product_subtypes_deletedAt_idx" ON "product_subtypes"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "product_subtypes_productId_code_key" ON "product_subtypes"("productId", "code");

-- CreateIndex
CREATE INDEX "processed_product_allowed_products_processedProductId_idx" ON "processed_product_allowed_products"("processedProductId");

-- CreateIndex
CREATE INDEX "processed_product_allowed_products_productId_idx" ON "processed_product_allowed_products"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "processed_product_allowed_products_processedProductId_productId_key" ON "processed_product_allowed_products"("processedProductId", "productId");

-- CreateIndex
CREATE INDEX "processed_product_allowed_subtypes_processedProductId_idx" ON "processed_product_allowed_subtypes"("processedProductId");

-- CreateIndex
CREATE INDEX "processed_product_allowed_subtypes_productSubtypeId_idx" ON "processed_product_allowed_subtypes"("productSubtypeId");

-- CreateIndex
CREATE UNIQUE INDEX "processed_product_allowed_subtypes_processedProductId_productSubtypeId_key" ON "processed_product_allowed_subtypes"("processedProductId", "productSubtypeId");

-- CreateIndex
CREATE INDEX "processed_product_allowed_varieties_processedProductId_idx" ON "processed_product_allowed_varieties"("processedProductId");

-- CreateIndex
CREATE INDEX "processed_product_allowed_varieties_varietyId_idx" ON "processed_product_allowed_varieties"("varietyId");

-- CreateIndex
CREATE UNIQUE INDEX "processed_product_allowed_varieties_processedProductId_varietyId_key" ON "processed_product_allowed_varieties"("processedProductId", "varietyId");
