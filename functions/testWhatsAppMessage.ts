import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { user_phone, message } = await req.json();

        console.log("📤 Teste de envio para:", user_phone);

        // Buscar instância ativa
        const instances = await base44.asServiceRole.entities.WhatsAppInstance.filter({
            is_connected: true
        });

        if (instances.length === 0) {
            return Response.json({ 
                success: false,
                error: 'Nenhuma instância WhatsApp ativa encontrada. Conecte uma instância primeiro.' 
            });
        }

        const instance = instances[0];
        console.log("✅ Usando instância:", instance.instance_id);

        // Enviar mensagem
        const response = await base44.asServiceRole.functions.invoke('sendWhatsAppMessage', {
            user_phone,
            message,
            instance_name: instance.instance_id
        });

        return Response.json({ 
            success: true,
            message: "Mensagem enviada com sucesso!",
            instance: instance.instance_name,
            response: response.data
        });

    } catch (error) {
        console.error("❌ Erro no teste:", error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});