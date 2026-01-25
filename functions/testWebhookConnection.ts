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

        console.log("=== TESTE DE WEBHOOK ===");
        console.log("Instância:", instance.instance_id);

        // 1. Verificar webhook configurado
        const webhookResponse = await fetch(`${evolutionApiUrl}/webhook/find/${instance.instance_id}`, {
            method: 'GET',
            headers: { 'apikey': token }
        });

        const webhookData = await webhookResponse.json();
        console.log("Webhook config:", JSON.stringify(webhookData, null, 2));

        // 2. Verificar status da instância
        const statusResponse = await fetch(`${evolutionApiUrl}/instance/connectionState/${instance.instance_id}`, {
            method: 'GET',
            headers: { 'apikey': token }
        });

        const statusData = await statusResponse.json();
        console.log("Status:", JSON.stringify(statusData, null, 2));

        return Response.json({ 
            success: true,
            webhook: webhookData,
            status: statusData,
            instance_id: instance.instance_id
        });

    } catch (error) {
        console.error("Erro:", error);
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});