/*
  Warnings:

  - You are about to drop the column `name` on the `WhatsAppInstance` table. All the data in the column will be lost.
  - You are about to drop the column `qrcode` on the `WhatsAppInstance` table. All the data in the column will be lost.
  - Added the required column `instance_name` to the `WhatsAppInstance` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WhatsAppInstance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instance_name" TEXT NOT NULL,
    "phone_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "qr_code" TEXT,
    "auth_state" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "user_email" TEXT,
    CONSTRAINT "WhatsAppInstance_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "User" ("user_phone") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WhatsAppInstance" ("created_at", "id", "status", "updated_at") SELECT "created_at", "id", "status", "updated_at" FROM "WhatsAppInstance";
DROP TABLE "WhatsAppInstance";
ALTER TABLE "new_WhatsAppInstance" RENAME TO "WhatsAppInstance";
CREATE UNIQUE INDEX "WhatsAppInstance_instance_name_key" ON "WhatsAppInstance"("instance_name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
