/**
 * Conversation Service
 *
 * Gerencia histórico de conversas e contexto para cada usuário
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Cache em memória para conversas ativas (últimos 30 minutos)
const conversationCache = new Map();
const CONVERSATION_TTL = 30 * 60 * 1000; // 30 minutos

/**
 * Salvar mensagem no histórico
 */
async function saveMessage({ user_phone, role, content, has_media = false, media_type = null, media_url = null }) {
    try {
        const message = await prisma.conversationMessage.create({
            data: {
                user_phone,
                role, // 'user' ou 'assistant'
                content,
                has_media,
                media_type,
                media_url
            }
        });

        // Atualizar cache
        const cacheKey = user_phone;
        if (!conversationCache.has(cacheKey)) {
            conversationCache.set(cacheKey, {
                messages: [],
                lastActivity: Date.now()
            });
        }

        const cached = conversationCache.get(cacheKey);
        cached.messages.push({
            role,
            content,
            timestamp: message.created_at
        });
        cached.lastActivity = Date.now();

        return message;
    } catch (error) {
        console.error('Erro ao salvar mensagem:', error);
        throw error;
    }
}

/**
 * Obter histórico de conversa recente (últimas 10 mensagens ou últimos 30 min)
 */
async function getConversationHistory(user_phone, limit = 10) {
    try {
        // Verificar cache primeiro
        const cacheKey = user_phone;
        const cached = conversationCache.get(cacheKey);

        if (cached && Date.now() - cached.lastActivity < CONVERSATION_TTL) {
            // Retornar do cache se ainda válido
            return cached.messages.slice(-limit);
        }

        // Buscar do banco de dados
        const thirtyMinutesAgo = new Date(Date.now() - CONVERSATION_TTL);

        const messages = await prisma.conversationMessage.findMany({
            where: {
                user_phone,
                created_at: {
                    gte: thirtyMinutesAgo
                }
            },
            orderBy: {
                created_at: 'asc'
            },
            take: limit
        });

        const formattedMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.created_at
        }));

        // Atualizar cache
        conversationCache.set(cacheKey, {
            messages: formattedMessages,
            lastActivity: Date.now()
        });

        return formattedMessages;
    } catch (error) {
        console.error('Erro ao obter histórico de conversa:', error);
        return [];
    }
}

/**
 * Limpar histórico de conversa
 */
async function clearConversationHistory(user_phone) {
    try {
        conversationCache.delete(user_phone);

        await prisma.conversationMessage.deleteMany({
            where: { user_phone }
        });

        return { success: true };
    } catch (error) {
        console.error('Erro ao limpar histórico:', error);
        throw error;
    }
}

/**
 * Limpar cache de conversas expiradas (executar periodicamente)
 */
function cleanupExpiredConversations() {
    const now = Date.now();

    for (const [user_phone, conversation] of conversationCache.entries()) {
        if (now - conversation.lastActivity > CONVERSATION_TTL) {
            conversationCache.delete(user_phone);
        }
    }
}

// Executar limpeza a cada 5 minutos
setInterval(cleanupExpiredConversations, 5 * 60 * 1000);

module.exports = {
    saveMessage,
    getConversationHistory,
    clearConversationHistory
};
