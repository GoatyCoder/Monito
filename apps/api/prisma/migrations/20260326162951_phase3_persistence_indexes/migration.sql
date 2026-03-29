-- CreateIndex
CREATE INDEX "audit_logs_operation_timestamp_idx" ON "audit_logs"("operation", "timestamp");

-- CreateIndex
CREATE INDEX "field_lots_varietyId_deletedAt_idx" ON "field_lots"("varietyId", "deletedAt");

-- CreateIndex
CREATE INDEX "field_lots_deletedAt_idx" ON "field_lots"("deletedAt");

-- CreateIndex
CREATE INDEX "field_lots_createdAt_idx" ON "field_lots"("createdAt");

-- CreateIndex
CREATE INDEX "packagings_deletedAt_idx" ON "packagings"("deletedAt");

-- CreateIndex
CREATE INDEX "packagings_createdAt_idx" ON "packagings"("createdAt");

-- CreateIndex
CREATE INDEX "pallet_items_palletId_idx" ON "pallet_items"("palletId");

-- CreateIndex
CREATE INDEX "pallet_items_processedProductId_idx" ON "pallet_items"("processedProductId");

-- CreateIndex
CREATE INDEX "pallet_items_packagingId_idx" ON "pallet_items"("packagingId");

-- CreateIndex
CREATE INDEX "pallets_deletedAt_idx" ON "pallets"("deletedAt");

-- CreateIndex
CREATE INDEX "pallets_fieldLotId_deletedAt_idx" ON "pallets"("fieldLotId", "deletedAt");

-- CreateIndex
CREATE INDEX "pallets_createdBy_idx" ON "pallets"("createdBy");

-- CreateIndex
CREATE INDEX "pallets_createdAt_idx" ON "pallets"("createdAt");

-- CreateIndex
CREATE INDEX "processed_products_deletedAt_idx" ON "processed_products"("deletedAt");

-- CreateIndex
CREATE INDEX "processed_products_createdAt_idx" ON "processed_products"("createdAt");

-- CreateIndex
CREATE INDEX "products_deletedAt_idx" ON "products"("deletedAt");

-- CreateIndex
CREATE INDEX "products_createdAt_idx" ON "products"("createdAt");

-- CreateIndex
CREATE INDEX "varieties_productId_deletedAt_idx" ON "varieties"("productId", "deletedAt");

-- CreateIndex
CREATE INDEX "varieties_deletedAt_idx" ON "varieties"("deletedAt");
