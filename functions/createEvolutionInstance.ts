import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { instance_name, phone } = await req.json();

        if (!instance_name) {
            return Response.json({ error: 'instance_name is required' }, { status: 400 });
        }

        const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL") || "https://evolution.agentesvirtuais.com";
        const token = Deno.env.get("EVOLUTION_API_TOKEN");

        // Usar o nome da instância fornecido (sanitizado para Evolution API)
        const instanceId = instance_name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        console.log("Criando instância:", instanceId);

        // Preparar webhook URL
        const webhookSecret = Deno.env.get("EVOLUTION_API_WEBHOOK_SECRET");
        const appId = Deno.env.get("BASE44_APP_ID");
        const webhookUrl = `https://base44.app/api/apps/${appId}/functions/whatsappWebhook?secret=${webhookSecret}`;

        console.log("Webhook URL:", webhookUrl);

        // Criar instância na Evolution API com webhook configurado
        const createResponse = await fetch(`${evolutionApiUrl}/instance/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': token
            },
            body: JSON.stringify({
                instanceName: instanceId,
                qrcode: true,
                integration: 'WHATSAPP-BAILEYS',
                channel: 'baileys',
                webhook: {
                    url: webhookUrl,
                    webhook_by_events: false,
                    webhook_base64: false,
                    events: [
                        'MESSAGES_UPSERT',
                        'CONNECTION_UPDATE',
                        'MESSAGES_UPDATE'
                    ]
                }
            })
        });

        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            console.error("Erro ao criar instância:", errorText);
            throw new Error(`Evolution API error: ${errorText}`);
        }

        const createResult = await createResponse.json();
        console.log("Instância criada com webhook:", createResult);

        // Aguardar um pouco para a instância estar pronta
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Buscar QR Code
        console.log("Buscando QR Code...");
        const qrResponse = await fetch(`${evolutionApiUrl}/instance/connect/${instanceId}`, {
            method: 'GET',
            headers: {
                'apikey': token
            }
        });

        if (!qrResponse.ok) {
            throw new Error('Failed to get QR code');
        }

        const qrData = await qrResponse.json();

        // Criar registro no banco de dados
        const instance = await base44.asServiceRole.entities.WhatsAppInstance.create({
            instance_name: instance_name,
            instance_id: instanceId,
            phone: phone || '',
            is_connected: false,
            status: 'connecting',
            qr_code: qrData.base64 || qrData.qrcode?.base64
        });

        console.log("Registro criado no banco:", instance.id);

        return Response.json({
            success: true,
            instance: instance,
            qr_code: qrData.base64 || qrData.qrcode?.base64
        });

    } catch (error) {
        console.error("Erro ao criar instância:", error);
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
});