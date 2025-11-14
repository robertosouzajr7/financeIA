import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { instance_id } = await req.json();

        if (!instance_id) {
            return Response.json({ error: 'instance_id is required' }, { status: 400 });
        }

        const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL") || "https://evolution.agentesvirtuais.com";
        const token = Deno.env.get("EVOLUTION_API_TOKEN");

        // Buscar informações da instância na Evolution API
        const response = await fetch(`${evolutionApiUrl}/instance/fetchInstances?instanceName=${instance_id}`, {
            method: 'GET',
            headers: {
                'apikey': token
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch instance data');
        }

        const instances = await response.json();
        
        // Verificar se a instância existe e está conectada
        if (!instances || instances.length === 0) {
            return Response.json({
                success: false,
                is_connected: false,
                error: 'Instance not found'
            });
        }

        const instanceData = instances[0];
        const isConnected = instanceData.connectionStatus === 'open';

        // Atualizar registro no banco de dados
        const dbInstances = await base44.asServiceRole.entities.WhatsAppInstance.filter({ instance_id });
        
        if (dbInstances.length > 0) {
            const updateData = {
                is_connected: isConnected,
                status: isConnected ? 'connected' : 'connecting',
                last_connection: isConnected ? new Date().toISOString() : dbInstances[0].last_connection
            };

            // Se tiver o número do WhatsApp conectado, atualizar também
            if (isConnected && instanceData.ownerJid) {
                updateData.phone = instanceData.ownerJid.replace('@s.whatsapp.net', '');
            }

            await base44.asServiceRole.entities.WhatsAppInstance.update(dbInstances[0].id, updateData);
        }

        return Response.json({
            success: true,
            is_connected: isConnected,
            connectionStatus: instanceData.connectionStatus,
            phone: instanceData.ownerJid?.replace('@s.whatsapp.net', '')
        });

    } catch (error) {
        console.error("Erro ao verificar conexão:", error);
        return Response.json({
            success: false,
            is_connected: false,
            error: error.message
        }, { status: 500 });
    }
});