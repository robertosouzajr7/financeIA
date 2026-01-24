/**
 * Script para aplicar migration manualmente
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Aplicando alterações ao banco de dados...');

// SQL para criar a tabela ConversationMessage
const sql = `
-- CreateTable ConversationMessage
CREATE TABLE IF NOT EXISTS "ConversationMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_phone" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "has_media" BOOLEAN NOT NULL DEFAULT false,
    "media_type" TEXT,
    "media_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

// Caminho do banco de dados
const dbPath = path.join(__dirname, 'prisma', 'dev.db');

console.log('📂 Banco de dados:', dbPath);

if (!fs.existsSync(dbPath)) {
    console.error('❌ Banco de dados não encontrado!');
    process.exit(1);
}

// Escrever SQL em arquivo temporário
const sqlFile = path.join(__dirname, 'temp_migration.sql');
fs.writeFileSync(sqlFile, sql);

console.log('📝 SQL criado:', sqlFile);

try {
    // Executar SQL no banco
    const Database = require('better-sqlite3');
    const db = new Database(dbPath);

    db.exec(sql);

    console.log('✅ Tabela ConversationMessage criada!');

    // Tentar adicionar colunas ao KnowledgeDocument
    try {
        db.exec('ALTER TABLE KnowledgeDocument ADD COLUMN title TEXT');
        console.log('✅ Coluna title adicionada ao KnowledgeDocument');
    } catch (e) {
        console.log('ℹ️  Coluna title já existe');
    }

    try {
        db.exec('ALTER TABLE KnowledgeDocument ADD COLUMN category TEXT');
        console.log('✅ Coluna category adicionada ao KnowledgeDocument');
    } catch (e) {
        console.log('ℹ️  Coluna category já existe');
    }

    try {
        db.exec('ALTER TABLE KnowledgeDocument ADD COLUMN is_active INTEGER DEFAULT 1');
        console.log('✅ Coluna is_active adicionada ao KnowledgeDocument');
    } catch (e) {
        console.log('ℹ️  Coluna is_active já existe');
    }

    db.close();

    // Limpar arquivo temporário
    fs.unlinkSync(sqlFile);

    console.log('✅ Migration aplicada com sucesso!');

} catch (error) {
    console.error('❌ Erro ao aplicar migration:', error.message);
    fs.unlinkSync(sqlFile);
    process.exit(1);
}
