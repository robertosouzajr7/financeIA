import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const instances = await base44.asServiceRole.entities.WhatsAppInstance.filter({
            is_connected: true
        });

        if (instances.length === 0) {
            return Response.json({ 
                success: false,
                error: 'Nenhuma instância ativa' 
            });
        }

        const instance = instances[0];
        const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL") || "https://evolution.agentesvirtuais.com";
        const token = Deno.env.get("EVOLUTION_API_TOKEN");
        const webhookSecret = Deno.env.get("EVOLUTION_API_WEBHOOK_SECRET");
        const appId = Deno.env.get("BASE44_APP_ID");
        
        const webhookUrl = `https://base44.app/api/apps/${appId}/functions/whatsappWebhook?secret=${webhookSecret}`;

        console.log("=== RESETANDO WEBHOOK ===");
        console.log("1️⃣ Deletando webhook antigo...");

        // DELETAR webhook antigo
        const deleteResponse = await fetch(`${evolutionApiUrl}/webhook/delete/${instance.instance_id}`, {
            method: 'DELETE',
            headers: {
                'apikey': token
            }
        });

        console.log("Status delete:", deleteResponse.status);

        // Aguardar um pouco
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log("2️⃣ Criando webhook novo...");

        // CRIAR webhook novo com configuração correta
        const webhookPayload = {
            webhook: {
                url: webhookUrl,
                webhook_by_events: false,
                webhook_base64: false,
                events: [],
                enabled: true
            }
        };

        const createResponse = await fetch(`${evolutionApiUrl}/webhook/set/${instance.instance_id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': token
            },
            body: JSON.stringify(webhookPayload)
        });

        const responseText = await createResponse.text();
        console.log("Resposta:", responseText);

        if (!createResponse.ok) {
            return Response.json({ 
                success: false,
                error: `Erro ao criar webhook: ${responseText}`
            }, { status: 200 });
        }

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            result = { raw: responseText };
        }

        console.log("✅ Webhook resetado com sucesso!");

        return Response.json({ 
            success: true,
            message: 'Webhook deletado e recriado com sucesso!',
            result: result
        });

    } catch (error) {
        console.error("❌ Erro:", error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 200 });
    }
});