/*
  Warnings:

  - You are about to drop the column `category` on the `KnowledgeDocument` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `KnowledgeDocument` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `KnowledgeDocument` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `KnowledgeDocument` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_phone" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_KnowledgeDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "embedding" TEXT,
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_KnowledgeDocument" ("content", "created_at", "id") SELECT "content", "created_at", "id" FROM "KnowledgeDocument";
DROP TABLE "KnowledgeDocument";
ALTER TABLE "new_KnowledgeDocument" RENAME TO "KnowledgeDocument";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
