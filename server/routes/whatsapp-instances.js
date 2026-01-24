const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { 
  startWhatsAppConnection, 
  stopWhatsAppConnection, 
  getQRCode,
  isConnected,
  sendWhatsAppMessage
} = require('../services/whatsapp');
const { generateResponse } = require('../utils/llm');

const router = express.Router();
const prisma = new PrismaClient();

// Message handler for incoming WhatsApp messages
async function handleIncomingMessage({ from, message, instanceName, sock }) {
  try {
    const userPhone = from.split('@')[0]; // Extract phone number
    
    console.log('🔍 Debug - Full message object:', { from, message, userPhone });
    
    // Find user with organization context
    let user = await prisma.user.findUnique({
      where: { user_phone: userPhone },
      include: {
        organizations: {
          include: {
            organization: true
          }
        }
      }
    });

    console.log('🔍 Debug - User found:', user ? `Yes (${user.user_phone})` : 'No');

    if (!user) {
      console.log(`❌ User not registered: ${userPhone}`);
      return;
    }

    // Determine active organization (default to first one for now)
    const activeOrg = user.organizations[0]?.organization;
    const orgContext = activeOrg ? `Você está assistindo a organização: ${activeOrg.name}.` : '';

    const now = new Date();
    const isAuthenticated = user.is_authenticated && 
                           user.authentication_expires && 
                           new Date(user.authentication_expires) > now;

    const conversationStarted = user.conversation_started;
    const hasKeyword = message && message.toLowerCase().includes('financeia');

    // Conversation Start Logic
    if (!conversationStarted && !hasKeyword && !isAuthenticated) {
      return;
    }

    if (hasKeyword && !conversationStarted) {
      await prisma.user.update({
        where: { id: user.id },
        data: { conversation_started: true }
      });

      if (isAuthenticated) {
        const welcomeMessage = `👋 Olá! Bem-vindo de volta ao FinanceIA${activeOrg ? ` (${activeOrg.name})` : ''}!\\n\\nVocê já está autenticado. Como posso ajudar?`;
        await sock.sendMessage(from, { text: welcomeMessage });
        return;
      } else {
        const loginPrompt = "👋 Olá! Bem-vindo ao FinanceIA!\\n\\n🔐 Para acessar seus dados financeiros, por favor envie sua senha de acesso.";
        await sock.sendMessage(from, { text: loginPrompt });
        return;
      }
    }

    // Logout Logic
    if (message && ['sair', 'logout', 'deslogar'].includes(message.toLowerCase())) {
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          is_authenticated: false,
          authentication_expires: null,
          conversation_started: false
        }
      });
      const logoutMessage = "👋 Você foi deslogado com sucesso!\\n\\nPara acessar novamente, envie: financeIA";
      await sock.sendMessage(from, { text: logoutMessage });
      return;
    }

    // Authentication Logic
    if (!isAuthenticated) {
      if (!message) {
        const loginPrompt = "🔐 Autenticação Necessária\\n\\nPara acessar seus dados financeiros, envie sua senha de acesso.";
        await sock.sendMessage(from, { text: loginPrompt });
        return;
      }

      const providedHash = Buffer.from(message).toString('base64');
      
      if (providedHash === user.password_hash) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            is_authenticated: true,
            last_authenticated: now,
            authentication_expires: expiresAt
          }
        });

        const welcomeMessage = `✅ Autenticação bem-sucedida!\\n\\n🎉 Bem-vindo ao FinanceIA${activeOrg ? ` (${activeOrg.name})` : ''}!`;
        await sock.sendMessage(from, { text: welcomeMessage });
        return;
      } else {
        const errorMessage = "❌ Senha incorreta\\n\\nTente novamente.";
        await sock.sendMessage(from, { text: errorMessage });
        return;
      }
    }

    // Authenticated - Process Message with LLM
    // Inject organization context into the message or system prompt
    // For now, we prepend it to the message for the LLM to see
    const messageWithContext = `${orgContext}\n\nUsuário diz: ${message}`;
    const llmResponse = await generateResponse(messageWithContext);
    await sock.sendMessage(from, { text: llmResponse });

  } catch (error) {
    console.error('Error handling message:', error);
  }
}

// List all instances
router.get('/', async (req, res) => {
  try {
    const instances = await prisma.whatsAppInstance.findMany({
      orderBy: { created_at: 'desc' }
    });

    // Add connection status
    const instancesWithStatus = instances.map(inst => ({
      ...inst,
      is_connected: isConnected(inst.id)
    }));

    console.log('📋 Instances:', instancesWithStatus.map(i => ({ id: i.id, name: i.instance_name, status: i.status })));

    res.json(instancesWithStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new instance
router.post('/', async (req, res) => {
  try {
    const { instance_name } = req.body;

    if (!instance_name) {
      return res.status(400).json({ error: 'instance_name is required' });
    }

    const instance = await prisma.whatsAppInstance.create({
      data: {
        instance_name,
        status: 'disconnected'
      }
    });

    res.json(instance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start instance connection
router.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;

    await startWhatsAppConnection(id, handleIncomingMessage);

    res.json({ message: 'Connection started', instanceId: id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop instance connection
router.post('/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;

    await stopWhatsAppConnection(id);

    res.json({ message: 'Connection stopped', instanceId: id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get QR code for instance
router.get('/:id/qrcode', async (req, res) => {
  try {
    const { id } = req.params;

    const qrCode = await getQRCode(id);

    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not available' });
    }

    res.json({ qr_code: qrCode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete instance
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Stop connection if active
    await stopWhatsAppConnection(id);

    // Delete from database
    await prisma.whatsAppInstance.delete({
      where: { id }
    });

    res.json({ message: 'Instance deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
