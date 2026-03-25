-- AlterTable
ALTER TABLE "field_lots" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "packagings" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "pallets" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "processed_products" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "products" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "varieties" ADD COLUMN "deletedAt" DATETIME;
