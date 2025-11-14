import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log("=== WEBHOOK CHAMADO ===");
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Validação simplificada
        const userAgent = req.headers.get("user-agent");
        const contentType = req.headers.get("content-type");
        
        if (!userAgent?.includes("axios") && !contentType?.includes("application/json")) {
            console.log("❌ Requisição suspeita");
            return Response.json({ error: 'Invalid request' }, { status: 401 });
        }

        const payload = await req.json();
        console.log("📦 Evento recebido:", payload.event);
        console.log("📦 Payload completo:", JSON.stringify(payload, null, 2));

        const event = payload.event;
        
        // Aceitar tanto messages.upsert quanto MESSAGES_UPSERT
        if (event !== 'messages.upsert' && event !== 'MESSAGES_UPSERT') {
            console.log("⏭️ Evento ignorado:", event);
            return Response.json({ success: true, message: 'Event ignored' });
        }

        const data = payload.data;
        
        const userPhone = data.key?.remoteJid?.replace('@s.whatsapp.net', '') || '';
        
        // Detectar tipo de mensagem
        const messageContent = data.message?.conversation || 
                              data.message?.extendedTextMessage?.text || 
                              data.message?.imageMessage?.caption ||
                              data.message?.documentMessage?.caption ||
                              '';
        
        // Detectar mídia
        const hasImage = !!data.message?.imageMessage;
        const hasDocument = !!data.message?.documentMessage;
        const hasAudio = !!data.message?.audioMessage;
        const hasPtt = !!data.message?.audioMessage?.ptt;
        
        console.log("📱 Telefone:", userPhone);
        console.log("💬 Conteúdo:", messageContent);
        console.log("🖼️ Tem imagem:", hasImage);
        console.log("📄 Tem documento:", hasDocument);
        console.log("🎤 Tem áudio:", hasAudio || hasPtt);
        
        if (!userPhone) {
            console.log("❌ Formato inválido");
            return Response.json({ success: true, message: 'Invalid message format' });
        }

        // Se não tem conteúdo de texto nem mídia, ignorar
        if (!messageContent && !hasImage && !hasDocument && !hasAudio && !hasPtt) {
            console.log("❌ Sem conteúdo");
            return Response.json({ success: true, message: 'No content' });
        }

        // Verificar duplicatas
        const recentMessages = await base44.asServiceRole.entities.ConversationMessage.filter({
            user_phone: userPhone,
            role: 'user',
            content: messageContent || 'media'
        }, '-created_date', 1);

        if (recentMessages.length > 0) {
            const lastMessage = recentMessages[0];
            const timeDiff = Date.now() - new Date(lastMessage.created_date).getTime();
            if (timeDiff < 3000) {
                console.log("⏭️ Mensagem duplicada ignorada");
                return Response.json({ success: true, message: 'Duplicate message ignored' });
            }
        }

        console.log("✅ Salvando mensagem...");

        // Determinar tipo de mídia
        let mediaType = 'none';
        let mediaUrl = null;
        
        if (hasImage) {
            mediaType = 'image';
            mediaUrl = data.message.imageMessage.url;
        } else if (hasDocument) {
            mediaType = 'document';
            mediaUrl = data.message.documentMessage.url;
        } else if (hasAudio || hasPtt) {
            mediaType = 'audio';
            mediaUrl = data.message.audioMessage?.url;
        }

        await base44.asServiceRole.entities.ConversationMessage.create({
            user_phone: userPhone,
            role: 'user',
            content: messageContent || `[${mediaType}]`,
            has_media: mediaType !== 'none',
            media_type: mediaType,
            media_url: mediaUrl
        });

        console.log("✅ Processando...");

        const response = await base44.asServiceRole.functions.invoke('processWhatsAppMessage', {
            user_phone: userPhone,
            message: messageContent,
            instance_name: payload.instance || 'default',
            has_media: mediaType !== 'none',
            media_type: mediaType,
            media_data: hasImage ? data.message.imageMessage : 
                        hasDocument ? data.message.documentMessage : 
                        (hasAudio || hasPtt) ? data.message.audioMessage : null
        });

        console.log("✅ Resposta enviada");

        return Response.json({ success: true, response: response.data });
        
    } catch (error) {
        console.error("❌ Erro:", error);
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});