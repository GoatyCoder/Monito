-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");
