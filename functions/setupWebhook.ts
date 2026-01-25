import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Buscar instância ativa
        const instances = await base44.asServiceRole.entities.WhatsAppInstance.filter({
            is_connected: true
        });

        if (instances.length === 0) {
            return Response.json({ 
                success: false,
                error: 'Nenhuma instância ativa encontrada. Conecte uma instância primeiro.' 
            });
        }

        const instance = instances[0];
        const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL") || "https://evolution.agentesvirtuais.com";
        const token = Deno.env.get("EVOLUTION_API_TOKEN");
        const webhookSecret = Deno.env.get("EVOLUTION_API_WEBHOOK_SECRET");
        const appId = Deno.env.get("BASE44_APP_ID");
        
        // URL fixa do Base44
        const webhookUrl = `https://base44.app/api/apps/${appId}/functions/whatsappWebhook?secret=${webhookSecret}`;

        console.log("=== CONFIGURANDO WEBHOOK ===");
        console.log("🔧 Instância:", instance.instance_id);
        console.log("📍 URL do webhook:", webhookUrl);
        console.log("🌐 Evolution API URL:", evolutionApiUrl);

        // Estrutura correta: webhook_by_events DEVE SER FALSE para funcionar
        const webhookPayload = {
            webhook: {
                url: webhookUrl,
                webhook_by_events: false,
                webhook_base64: false,
                events: [],
                enabled: true
            }
        };

        console.log("📦 Payload:", JSON.stringify(webhookPayload, null, 2));

        // Configurar webhook na Evolution API
        const response = await fetch(`${evolutionApiUrl}/webhook/set/${instance.instance_id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': token
            },
            body: JSON.stringify(webhookPayload)
        });

        console.log("📥 Status da resposta:", response.status);

        const responseText = await response.text();
        console.log("📄 Resposta:", responseText);

        if (!response.ok) {
            console.error("❌ Erro na resposta da Evolution API");
            return Response.json({ 
                success: false,
                error: `Erro da Evolution API (${response.status}): ${responseText}`,
                details: {
                    status: response.status,
                    response: responseText,
                    instance_id: instance.instance_id,
                    webhook_url: webhookUrl
                }
            }, { status: 200 });
        }

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            result = { raw: responseText };
        }

        console.log("✅ Webhook configurado com sucesso");

        return Response.json({ 
            success: true,
            message: 'Webhook configurado com sucesso!',
            instance: instance.instance_name,
            webhook_url: webhookUrl,
            result: result
        });

    } catch (error) {
        console.error("❌ Erro ao configurar webhook:", error);
        console.error("Stack:", error.stack);
        
        return Response.json({ 
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 200 });
    }
});