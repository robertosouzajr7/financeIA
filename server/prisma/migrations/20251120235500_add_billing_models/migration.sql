/*
  Warnings:

  - You are about to drop the column `plan` on the `Subscription` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "interval" TEXT NOT NULL DEFAULT 'month',
    "features" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscription_id" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" TEXT NOT NULL,
    "paid_at" DATETIME,
    "hosted_invoice_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Invoice_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "Subscription" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organization_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "last4" TEXT,
    "brand" TEXT,
    "exp_month" INTEGER,
    "exp_year" INTEGER,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_email" TEXT NOT NULL,
    "organization_id" TEXT,
    "plan_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "current_period_end" DATETIME,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Subscription_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "User" ("user_phone") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Subscription_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Subscription_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "Plan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Subscription" ("created_at", "id", "organization_id", "status", "updated_at", "user_email") SELECT "created_at", "id", "organization_id", "status", "updated_at", "user_email" FROM "Subscription";
DROP TABLE "Subscription";
ALTER TABLE "new_Subscription" RENAME TO "Subscription";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
