# FinanceIA Refactoring Walkthrough

This document outlines the changes made to refactor **FinanceIA** into a standalone application, removing dependencies on the `base44` platform.

## 🎯 Objectives Achieved

- [x] **Backend Independence**: Created a full Node.js/Express backend with SQLite/Prisma.
- [x] **Frontend Refactoring**: Removed `@base44/sdk` and `@base44/vite-plugin`.
- [x] **API Migration**: Replaced all `base44` SDK calls with a custom Axios client pointing to the new backend.
- [x] **Entity & Function Migration**: Ported all database entities and key functions (WhatsApp processing, etc.).

## 🏗️ Architecture Changes

### Backend (`server/`)
- **Server**: Express.js server running on port 3000.
- **Database**: SQLite local database (`dev.db`) managed by Prisma.
- **Authentication**: JWT-based auth replacing `base44` auth.
- **Routes**:
    - `/api/auth`: Login and user session.
    - `/api/webhook/whatsapp`: Core logic for WhatsApp message processing.
    - `/api/transactions`: Financial transaction management.
    - `/api/[entity]`: Generic CRUD endpoints for all system entities (Users, Budgets, Goals, etc.).
    - `/api/functions`: Endpoints to invoke server-side logic (e.g., `createEvolutionInstance`).

### Frontend (`src/`)
- **API Client**: New `src/api/client.js` handles HTTP requests with JWT headers.
- **Compatibility Layer**: `src/api/base44Client.js` and `src/api/entities.js` now redirect legacy SDK calls to the new API, minimizing code changes in UI components.
- **New Entities**: Added missing entity definitions in `src/entities/` to support the full application schema.

## 🚀 How to Run

### 1. Start the Backend
The backend handles the database and API requests.
```bash
cd server
npm install
npx prisma migrate dev
node index.js
```
*Expected output: `FinanceIA Backend is running on port 3000`*

### 2. Start the Frontend
The frontend is the React user interface.
```bash
# In the project root
npm install
npm run dev
```
*Access the app at: `http://localhost:5173` (or the port shown in your terminal)*

## 🧪 Verification Steps

### 1. Authentication
- Open the app in your browser.
- Log in with the seed user:
    - **Phone**: `5511999999999`
    - **Password**: `password123`
- Verify you are redirected to the Dashboard.

### 2. Dashboard & Data
- Check if the Dashboard loads without errors.
- Verify that "Resumo Financeiro" and "Transações Recentes" are visible (even if empty initially).

### 3. Entity Management
- Navigate to **Orçamentos** or **Metas**.
- Try creating a new item.
- Verify it appears in the list.

### 4. WhatsApp Integration (Mock/Local)
- The webhook endpoint is at `http://localhost:3000/api/webhook/whatsapp`.
- This requires the Evolution API to be configured or mocked for full end-to-end testing.

### 5. Verifying Data in Database

You have two easy ways to check if data is being saved correctly:

**Option A: Visual Interface (Recommended)**
Run this command in a new terminal window inside the `server` folder:
```bash
cd server
npx prisma studio
```
This will open a web page where you can see and edit all data in your database.

**Option B: Command Line Script**
I created a quick script to show you the counts of everything in the database:
```bash
cd server
node verify-db.js
```

## � Environment Variables

To run the system fully (including WhatsApp and AI), you need to configure these variables in `server/.env`:

```env
# Server Configuration
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-me"

# WhatsApp Integration (Evolution API)
EVOLUTION_API_URL="https://api.evolution-api.com"
EVOLUTION_API_TOKEN="your-evolution-api-token"

# AI Configuration (Choose one)
LLM_PROVIDER="openai" # or "anthropic"
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
```

## �📂 Key Files Created/Modified

- `server/index.js`: Main backend entry point.
- `server/prisma/schema.prisma`: Database schema.
- `src/api/client.js`: New frontend API client.
- `src/entities/*.js`: Entity definitions mapping to backend routes.
