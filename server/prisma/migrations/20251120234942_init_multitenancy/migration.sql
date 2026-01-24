-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "OrganizationMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrganizationMember_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_phone" TEXT NOT NULL,
    "organization_id" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Alert_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Alert" ("created_at", "id", "is_read", "message", "severity", "title", "updated_at", "user_phone") SELECT "created_at", "id", "is_read", "message", "severity", "title", "updated_at", "user_phone" FROM "Alert";
DROP TABLE "Alert";
ALTER TABLE "new_Alert" RENAME TO "Alert";
CREATE TABLE "new_Budget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_phone" TEXT NOT NULL,
    "organization_id" TEXT,
    "category" TEXT NOT NULL,
    "limit_amount" REAL NOT NULL,
    "period" TEXT NOT NULL,
    "alert_threshold" INTEGER NOT NULL DEFAULT 80,
    "start_date" DATETIME NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Budget_user_phone_fkey" FOREIGN KEY ("user_phone") REFERENCES "User" ("user_phone") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Budget_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Budget" ("alert_threshold", "category", "created_at", "id", "is_active", "limit_amount", "period", "start_date", "updated_at", "user_phone") SELECT "alert_threshold", "category", "created_at", "id", "is_active", "limit_amount", "period", "start_date", "updated_at", "user_phone" FROM "Budget";
DROP TABLE "Budget";
ALTER TABLE "new_Budget" RENAME TO "Budget";
CREATE TABLE "new_Debt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_phone" TEXT NOT NULL,
    "organization_id" TEXT,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "due_date" DATETIME,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Debt_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Debt" ("amount", "created_at", "description", "due_date", "id", "is_paid", "updated_at", "user_phone") SELECT "amount", "created_at", "description", "due_date", "id", "is_paid", "updated_at", "user_phone" FROM "Debt";
DROP TABLE "Debt";
ALTER TABLE "new_Debt" RENAME TO "Debt";
CREATE TABLE "new_FinancialTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_phone" TEXT NOT NULL,
    "organization_id" TEXT,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT,
    "source" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "FinancialTransaction_user_phone_fkey" FOREIGN KEY ("user_phone") REFERENCES "User" ("user_phone") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FinancialTransaction_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FinancialTransaction" ("amount", "category", "created_at", "date", "description", "id", "is_recurring", "notes", "priority", "source", "type", "updated_at", "user_phone") SELECT "amount", "category", "created_at", "date", "description", "id", "is_recurring", "notes", "priority", "source", "type", "updated_at", "user_phone" FROM "FinancialTransaction";
DROP TABLE "FinancialTransaction";
ALTER TABLE "new_FinancialTransaction" RENAME TO "FinancialTransaction";
CREATE TABLE "new_Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_phone" TEXT NOT NULL,
    "organization_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target_amount" REAL NOT NULL,
    "current_amount" REAL NOT NULL DEFAULT 0,
    "priority" TEXT,
    "timeline" TEXT,
    "status" TEXT NOT NULL,
    "category" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Goal_user_phone_fkey" FOREIGN KEY ("user_phone") REFERENCES "User" ("user_phone") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Goal_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Goal" ("category", "created_at", "current_amount", "description", "id", "priority", "status", "target_amount", "timeline", "title", "updated_at", "user_phone") SELECT "category", "created_at", "current_amount", "description", "id", "priority", "status", "target_amount", "timeline", "title", "updated_at", "user_phone" FROM "Goal";
DROP TABLE "Goal";
ALTER TABLE "new_Goal" RENAME TO "Goal";
CREATE TABLE "new_RecurringExpense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_phone" TEXT NOT NULL,
    "organization_id" TEXT,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "category" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "due_day" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "send_reminder" BOOLEAN NOT NULL DEFAULT true,
    "auto_create" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "RecurringExpense_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RecurringExpense" ("amount", "auto_create", "category", "created_at", "description", "due_day", "frequency", "id", "is_active", "send_reminder", "updated_at", "user_phone") SELECT "amount", "auto_create", "category", "created_at", "description", "due_day", "frequency", "id", "is_active", "send_reminder", "updated_at", "user_phone" FROM "RecurringExpense";
DROP TABLE "RecurringExpense";
ALTER TABLE "new_RecurringExpense" RENAME TO "RecurringExpense";
CREATE TABLE "new_Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_email" TEXT NOT NULL,
    "organization_id" TEXT,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Subscription_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "User" ("user_phone") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Subscription_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Subscription" ("created_at", "id", "plan", "status", "updated_at", "user_email") SELECT "created_at", "id", "plan", "status", "updated_at", "user_email" FROM "Subscription";
DROP TABLE "Subscription";
ALTER TABLE "new_Subscription" RENAME TO "Subscription";
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
    "organization_id" TEXT,
    CONSTRAINT "WhatsAppInstance_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "User" ("user_phone") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WhatsAppInstance_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WhatsAppInstance" ("auth_state", "created_at", "id", "instance_name", "phone_number", "qr_code", "status", "updated_at", "user_email") SELECT "auth_state", "created_at", "id", "instance_name", "phone_number", "qr_code", "status", "updated_at", "user_email" FROM "WhatsAppInstance";
DROP TABLE "WhatsAppInstance";
ALTER TABLE "new_WhatsAppInstance" RENAME TO "WhatsAppInstance";
CREATE UNIQUE INDEX "WhatsAppInstance_instance_name_key" ON "WhatsAppInstance"("instance_name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_user_id_organization_id_key" ON "OrganizationMember"("user_id", "organization_id");
