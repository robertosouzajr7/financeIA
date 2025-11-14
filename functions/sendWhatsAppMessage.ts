import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log("=== ENVIAR MENSAGEM ===");
    
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            console.log("❌ Não autorizado");
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { user_phone, message, instance_name } = await req.json();

        console.log("📱 Telefone:", user_phone);
        console.log("💬 Mensagem:", message);
        console.log("📲 Instância:", instance_name);

        if (!user_phone || !message) {
            return Response.json({ 
                error: 'user_phone and message are required' 
            }, { status: 400 });
        }

        // Buscar instância ativa
        const instances = await base44.asServiceRole.entities.WhatsAppInstance.filter({
            is_connected: true
        });

        if (instances.length === 0) {
            console.error("❌ Nenhuma instância ativa encontrada");
            return Response.json({ 
                error: 'No active WhatsApp instance found' 
            }, { status: 404 });
        }

        const instance = instances[0];
        console.log("✅ Usando instância:", instance.instance_id);

        const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL") || "https://evolution.agentesvirtuais.com";
        const token = Deno.env.get("EVOLUTION_API_TOKEN");

        const payload = {
            number: user_phone,
            text: message
        };

        console.log("📤 Enviando para Evolution API...");
        console.log("URL:", `${evolutionApiUrl}/message/sendText/${instance.instance_id}`);
        console.log("Payload:", JSON.stringify(payload, null, 2));

        // Enviar mensagem via Evolution API
        const response = await fetch(`${evolutionApiUrl}/message/sendText/${instance.instance_id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': token
            },
            body: JSON.stringify(payload)
        });

        console.log("📥 Status da resposta:", response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Erro da Evolution API:", errorText);
            throw new Error(`Evolution API error: ${errorText}`);
        }

        const result = await response.json();
        console.log("✅ Mensagem enviada:", result);

        // Salvar mensagem do assistente no histórico
        await base44.asServiceRole.entities.ConversationMessage.create({
            user_phone: user_phone,
            role: 'assistant',
            content: message,
            has_media: false,
            media_type: 'none'
        });

        console.log("✅ Mensagem salva no histórico");

        return Response.json({ 
            success: true, 
            message_id: result.key?.id,
            result 
        });

    } catch (error) {
        console.error("❌ Erro ao enviar mensagem:", error);
        console.error("Stack:", error.stack);
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});