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
                error: 'Nenhuma instância ativa encontrada' 
            });
        }

        const instance = instances[0];
        const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL") || "https://evolution.agentesvirtuais.com";
        const token = Deno.env.get("EVOLUTION_API_TOKEN");

        // Verificar configuração do webhook
        const response = await fetch(`${evolutionApiUrl}/webhook/find/${instance.instance_id}`, {
            method: 'GET',
            headers: {
                'apikey': token
            }
        });

        if (!response.ok) {
            return Response.json({ 
                success: false,
                error: 'Não foi possível verificar webhook'
            });
        }

        const webhookData = await response.json();
        
        // URL fixa do Base44
        const appId = Deno.env.get("BASE44_APP_ID");
        const webhookSecret = Deno.env.get("EVOLUTION_API_WEBHOOK_SECRET");
        const webhookUrl = `https://base44.app/api/apps/${appId}/functions/whatsappWebhook?secret=${webhookSecret}`;
        
        const configuredUrl = webhookData.webhook?.url || null;
        const isConfigured = configuredUrl && configuredUrl.includes(appId) && configuredUrl.includes('whatsappWebhook');

        return Response.json({ 
            success: isConfigured,
            configured_url: configuredUrl,
            expected_url: webhookUrl,
            webhook_enabled: webhookData.webhook?.enabled || false,
            events: webhookData.webhook?.events || [],
            match: configuredUrl === webhookUrl
        });

    } catch (error) {
        console.error("❌ Erro ao verificar webhook:", error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});