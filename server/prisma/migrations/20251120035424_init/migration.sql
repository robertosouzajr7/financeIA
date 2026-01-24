-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_phone" TEXT NOT NULL,
    "password_hash" TEXT,
    "is_authenticated" BOOLEAN NOT NULL DEFAULT false,
    "authentication_expires" DATETIME,
    "conversation_started" BOOLEAN NOT NULL DEFAULT false,
    "last_authenticated" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FinancialTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_phone" TEXT NOT NULL,
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
    CONSTRAINT "FinancialTransaction_user_phone_fkey" FOREIGN KEY ("user_phone") REFERENCES "User" ("user_phone") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_phone" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "limit_amount" REAL NOT NULL,
    "period" TEXT NOT NULL,
    "alert_threshold" INTEGER NOT NULL DEFAULT 80,
    "start_date" DATETIME NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Budget_user_phone_fkey" FOREIGN KEY ("user_phone") REFERENCES "User" ("user_phone") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_phone" TEXT NOT NULL,
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
    CONSTRAINT "Goal_user_phone_fkey" FOREIGN KEY ("user_phone") REFERENCES "User" ("user_phone") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enable_image_processing" BOOLEAN NOT NULL DEFAULT false,
    "claude_api_key" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_email" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Subscription_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "User" ("user_phone") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KnowledgeDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_user_phone_key" ON "User"("user_phone");
