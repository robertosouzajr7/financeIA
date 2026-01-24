/**
 * WhatsApp Message Service
 *
 * Serviço para envio de mensagens WhatsApp via Evolution API ou Baileys
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

/**
 * Envia uma mensagem WhatsApp
 * @param {Object} params - Parâmetros
 * @param {string} params.user_phone - Telefone do destinatário
 * @param {string} params.message - Mensagem a enviar
 * @param {string} params.instance_name - Nome da instância (opcional)
 */
async function sendMessage({ user_phone, message, instance_name = null }) {
    try {
        console.log(`📤 Enviando mensagem para ${user_phone}`);

        // Buscar instância ativa
        let instance;

        if (instance_name) {
            instance = await prisma.whatsAppInstance.findFirst({
                where: {
                    instance_name,
                    status: 'connected'
                }
            });
        } else {
            // Pegar primeira instância ativa
            instance = await prisma.whatsAppInstance.findFirst({
                where: {
                    status: 'connected'
                }
            });
        }

        if (!instance) {
            throw new Error('Nenhuma instância WhatsApp conectada encontrada');
        }

        console.log(`✅ Usando instância: ${instance.instance_name}`);

        const evolutionApiUrl = process.env.EVOLUTION_API_URL || 'https://evolution.agentesvirtuais.com';
        const token = process.env.EVOLUTION_API_TOKEN;

        if (!token) {
            throw new Error('EVOLUTION_API_TOKEN não configurado');
        }

        const payload = {
            number: user_phone,
            text: message
        };

        console.log(`📡 Enviando para Evolution API...`);

        // Enviar mensagem via Evolution API
        const response = await axios.post(
            `${evolutionApiUrl}/message/sendText/${instance.instance_name}`,
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': token
                }
            }
        );

        console.log(`✅ Mensagem enviada:`, response.data);

        // Salvar mensagem do assistente no histórico
        try {
            await prisma.conversationMessage.create({
                data: {
                    user_phone: user_phone,
                    role: 'assistant',
                    content: message,
                    has_media: false,
                    media_type: 'none'
                }
            });
            console.log('✅ Mensagem salva no histórico');
        } catch (error) {
            console.warn('⚠️  Erro ao salvar no histórico (modelo pode não existir ainda):', error.message);
        }

        return {
            success: true,
            message_id: response.data.key?.id,
            result: response.data
        };

    } catch (error) {
        console.error('❌ Erro ao enviar mensagem WhatsApp:', error.message);

        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }

        throw error;
    }
}

/**
 * Envia uma mensagem com mídia (imagem, vídeo, documento)
 * @param {Object} params - Parâmetros
 */
async function sendMediaMessage({ user_phone, caption, media_url, media_type, instance_name = null }) {
    try {
        console.log(`📤 Enviando mídia para ${user_phone}`);

        // Buscar instância ativa
        const instance = instance_name
            ? await prisma.whatsAppInstance.findFirst({ where: { instance_name, status: 'connected' } })
            : await prisma.whatsAppInstance.findFirst({ where: { status: 'connected' } });

        if (!instance) {
            throw new Error('Nenhuma instância WhatsApp conectada encontrada');
        }

        const evolutionApiUrl = process.env.EVOLUTION_API_URL || 'https://evolution.agentesvirtuais.com';
        const token = process.env.EVOLUTION_API_TOKEN;

        const endpoint = media_type === 'image'
            ? 'sendMedia'
            : media_type === 'document'
            ? 'sendMedia'
            : 'sendMedia';

        const payload = {
            number: user_phone,
            mediaUrl: media_url,
            caption: caption || ''
        };

        const response = await axios.post(
            `${evolutionApiUrl}/message/${endpoint}/${instance.instance_name}`,
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': token
                }
            }
        );

        console.log(`✅ Mídia enviada:`, response.data);

        return {
            success: true,
            message_id: response.data.key?.id,
            result: response.data
        };

    } catch (error) {
        console.error('❌ Erro ao enviar mídia WhatsApp:', error.message);
        throw error;
    }
}

module.exports = {
    sendMessage,
    sendMediaMessage
};
