-- AlterTable
ALTER TABLE "users" ADD COLUMN "lastLoginAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "masterDataPageSize" INTEGER NOT NULL DEFAULT 20,
    "auditLogPageSize" INTEGER NOT NULL DEFAULT 20,
    "lockScreenEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lockScreenTimeoutMinutes" INTEGER NOT NULL DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_preferences" ("auditLogPageSize", "createdAt", "id", "masterDataPageSize", "updatedAt", "userId") SELECT "auditLogPageSize", "createdAt", "id", "masterDataPageSize", "updatedAt", "userId" FROM "user_preferences";
DROP TABLE "user_preferences";
ALTER TABLE "new_user_preferences" RENAME TO "user_preferences";
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
