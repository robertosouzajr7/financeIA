/**
 * WhatsApp Message Service (100% Native Baileys)
 *
 * Serviço para envio de mensagens WhatsApp usando apenas Baileys
 * SEM dependência de Evolution API ou qualquer serviço externo
 */

const { PrismaClient } = require('@prisma/client');
const {
    sendWhatsAppMessage,
    activeConnections,
    isConnected
} = require('./whatsapp');

const prisma = new PrismaClient();

/**
 * Envia uma mensagem WhatsApp usando Baileys nativo
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

        // Verificar se a conexão está ativa em memória
        if (!isConnected(instance.id)) {
            throw new Error(`Instância ${instance.instance_name} não está conectada`);
        }

        console.log(`✅ Usando instância: ${instance.instance_name}`);

        // Formatar número (remover caracteres especiais, manter apenas números)
        const cleanPhone = user_phone.replace(/\D/g, '');

        // Enviar mensagem usando Baileys nativo
        await sendWhatsAppMessage(instance.id, cleanPhone, message);

        console.log(`✅ Mensagem enviada com sucesso`);

        // Salvar mensagem do assistente no histórico
        try {
            await prisma.conversationMessage.create({
                data: {
                    user_phone: cleanPhone,
                    role: 'assistant',
                    content: message,
                    has_media: false,
                    media_type: null
                }
            });
            console.log('✅ Mensagem salva no histórico');
        } catch (error) {
            console.warn('⚠️  Erro ao salvar no histórico:', error.message);
        }

        return {
            success: true,
            instance: instance.instance_name,
            phone: cleanPhone
        };

    } catch (error) {
        console.error('❌ Erro ao enviar mensagem WhatsApp:', error.message);
        throw error;
    }
}

/**
 * Envia uma mensagem com mídia (imagem, vídeo, documento)
 * @param {Object} params - Parâmetros
 */
async function sendMediaMessage({ user_phone, caption, media_buffer, media_type, instance_name = null }) {
    try {
        console.log(`📤 Enviando mídia para ${user_phone}`);

        // Buscar instância ativa
        const instance = instance_name
            ? await prisma.whatsAppInstance.findFirst({ where: { instance_name, status: 'connected' } })
            : await prisma.whatsAppInstance.findFirst({ where: { status: 'connected' } });

        if (!instance) {
            throw new Error('Nenhuma instância WhatsApp conectada encontrada');
        }

        if (!isConnected(instance.id)) {
            throw new Error(`Instância ${instance.instance_name} não está conectada`);
        }

        // Obter socket ativo
        const sock = activeConnections.get(instance.id);

        if (!sock) {
            throw new Error('Socket não encontrado');
        }

        // Formatar número
        const cleanPhone = user_phone.replace(/\D/g, '');
        const jid = `${cleanPhone}@s.whatsapp.net`;

        // Preparar mídia baseado no tipo
        let messageContent;

        switch (media_type) {
            case 'image':
                messageContent = {
                    image: media_buffer,
                    caption: caption || ''
                };
                break;

            case 'video':
                messageContent = {
                    video: media_buffer,
                    caption: caption || ''
                };
                break;

            case 'document':
                messageContent = {
                    document: media_buffer,
                    caption: caption || '',
                    mimetype: 'application/pdf',
                    fileName: 'documento.pdf'
                };
                break;

            case 'audio':
                messageContent = {
                    audio: media_buffer,
                    mimetype: 'audio/mp4'
                };
                break;

            default:
                throw new Error(`Tipo de mídia não suportado: ${media_type}`);
        }

        // Enviar mídia
        await sock.sendMessage(jid, messageContent);

        console.log(`✅ Mídia enviada com sucesso`);

        return {
            success: true,
            instance: instance.instance_name,
            phone: cleanPhone,
            media_type
        };

    } catch (error) {
        console.error('❌ Erro ao enviar mídia WhatsApp:', error.message);
        throw error;
    }
}

/**
 * Envia mensagem com botões (interativa)
 */
async function sendButtonMessage({ user_phone, message, buttons, instance_name = null }) {
    try {
        const instance = instance_name
            ? await prisma.whatsAppInstance.findFirst({ where: { instance_name, status: 'connected' } })
            : await prisma.whatsAppInstance.findFirst({ where: { status: 'connected' } });

        if (!instance || !isConnected(instance.id)) {
            throw new Error('Instância não conectada');
        }

        const sock = activeConnections.get(instance.id);
        const cleanPhone = user_phone.replace(/\D/g, '');
        const jid = `${cleanPhone}@s.whatsapp.net`;

        // Montar mensagem com botões
        const buttonMessage = {
            text: message,
            footer: 'FinanceIA',
            buttons: buttons.map((btn, index) => ({
                buttonId: `btn_${index}`,
                buttonText: { displayText: btn },
                type: 1
            })),
            headerType: 1
        };

        await sock.sendMessage(jid, buttonMessage);

        console.log(`✅ Mensagem com botões enviada`);

        return {
            success: true,
            instance: instance.instance_name,
            phone: cleanPhone
        };

    } catch (error) {
        console.error('❌ Erro ao enviar mensagem com botões:', error.message);
        throw error;
    }
}

/**
 * Lista todas as instâncias ativas
 */
function getActiveInstances() {
    const instances = [];

    for (const [instanceId, sock] of activeConnections.entries()) {
        instances.push({
            id: instanceId,
            connected: sock && sock.user ? true : false,
            phone: sock.user?.id?.split(':')[0] || null
        });
    }

    return instances;
}

module.exports = {
    sendMessage,
    sendMediaMessage,
    sendButtonMessage,
    getActiveInstances
};
