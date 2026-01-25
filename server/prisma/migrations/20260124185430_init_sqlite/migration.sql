/*
  Warnings:

  - Added the required column `title` to the `KnowledgeDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `KnowledgeDocument` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "ConversationMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_phone" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "has_media" BOOLEAN NOT NULL DEFAULT false,
    "media_type" TEXT,
    "media_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_KnowledgeDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "embedding" TEXT,
    "metadata" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_KnowledgeDocument" ("content", "created_at", "embedding", "id", "metadata") SELECT "content", "created_at", "embedding", "id", "metadata" FROM "KnowledgeDocument";
DROP TABLE "KnowledgeDocument";
ALTER TABLE "new_KnowledgeDocument" RENAME TO "KnowledgeDocument";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
