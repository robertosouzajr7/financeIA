/**
 * WhatsApp Messages Routes
 *
 * Rotas para enviar mensagens e processar webhooks do WhatsApp
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const whatsappMessageService = require('../services/whatsappMessageService');
const whatsappMessageProcessor = require('../services/whatsappMessageProcessor');

/**
 * POST /api/whatsapp-messages/send
 * Envia uma mensagem via WhatsApp
 */
router.post('/send', authMiddleware, async (req, res) => {
    try {
        const { user_phone, message, instance_name } = req.body;

        if (!user_phone || !message) {
            return res.status(400).json({
                error: 'user_phone and message are required'
            });
        }

        const result = await whatsappMessageService.sendMessage({
            user_phone,
            message,
            instance_name
        });

        res.json(result);

    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        res.status(500).json({
            error: 'Failed to send message',
            details: error.message
        });
    }
});

/**
 * POST /api/whatsapp-messages/webhook
 * Recebe mensagens do webhook do WhatsApp (Evolution API ou Baileys)
 */
router.post('/webhook', async (req, res) => {
    try {
        const payload = req.body;

        console.log('📨 Webhook WhatsApp recebido:', JSON.stringify(payload, null, 2));

        // Extrair dados da mensagem (formato Evolution API)
        const data = payload.data || payload;
        const message = data.message?.conversation || data.message?.extendedTextMessage?.text || '';
        const from = data.key?.remoteJid || data.from;
        const instance_name = data.instance || payload.instance;

        // Processar mensagem de forma assíncrona
        const user_phone = from.replace('@s.whatsapp.net', '');

        // Verificar se há mídia
        const has_media = data.message?.imageMessage || data.message?.documentMessage || false;
        const media_type = data.message?.imageMessage ? 'image' :
            data.message?.documentMessage ? 'document' : null;
        const media_data = has_media ? {
            url: data.message?.imageMessage?.url || data.message?.documentMessage?.url,
            mimetype: data.message?.imageMessage?.mimetype || data.message?.documentMessage?.mimetype,
            base64: data.message?.imageMessage?.jpegThumbnail || null
        } : null;

        // Processar mensagem (não bloquear resposta do webhook)
        whatsappMessageProcessor.processMessage({
            user_phone,
            message,
            instance_name,
            has_media,
            media_type,
            media_data
        }).catch(error => {
            console.error('Error processing WhatsApp message:', error);
        });

        // Responder imediatamente ao webhook
        res.json({ success: true, received: true });

    } catch (error) {
        console.error('Error in WhatsApp webhook:', error);
        res.status(500).json({
            error: 'Failed to process webhook',
            details: error.message
        });
    }
});

/**
 * POST /api/whatsapp-messages/test
 * Testa envio de mensagem (desenvolvimento)
 */
router.post('/test', authMiddleware, async (req, res) => {
    try {
        const { user_phone } = req.body;

        const testMessage = "🤖 Esta é uma mensagem de teste do FinanceIA!\n\n" +
            "Se você recebeu esta mensagem, significa que o sistema de WhatsApp está funcionando corretamente.";

        const result = await whatsappMessageService.sendMessage({
            user_phone,
            message: testMessage
        });

        res.json({
            success: true,
            message: 'Test message sent successfully',
            result
        });

    } catch (error) {
        console.error('Error sending test message:', error);
        res.status(500).json({
            error: 'Failed to send test message',
            details: error.message
        });
    }
});

module.exports = router;
