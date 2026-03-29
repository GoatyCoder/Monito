/*
  Warnings:

  - Added the required column `originCountryCode` to the `field_lots` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_field_lots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lotCode" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "varietyId" TEXT NOT NULL,
    "originCountryCode" TEXT NOT NULL,
    "originRegion" TEXT,
    "originProvince" TEXT,
    "originComune" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "field_lots_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "varieties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_field_lots" ("createdAt", "deletedAt", "id", "lotCode", "supplier", "updatedAt", "varietyId") SELECT "createdAt", "deletedAt", "id", "lotCode", "supplier", "updatedAt", "varietyId" FROM "field_lots";
DROP TABLE "field_lots";
ALTER TABLE "new_field_lots" RENAME TO "field_lots";
CREATE UNIQUE INDEX "field_lots_lotCode_key" ON "field_lots"("lotCode");
CREATE INDEX "field_lots_varietyId_deletedAt_idx" ON "field_lots"("varietyId", "deletedAt");
CREATE INDEX "field_lots_deletedAt_idx" ON "field_lots"("deletedAt");
CREATE INDEX "field_lots_createdAt_idx" ON "field_lots"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
