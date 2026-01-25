const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { 
  startWhatsAppConnection, 
  stopWhatsAppConnection, 
  getQRCode,
  isConnected,
  sendWhatsAppMessage,
  deleteSession
} = require('../services/whatsapp');
const { generateResponse } = require('../utils/llm');

const router = express.Router();
const prisma = new PrismaClient();
const authMiddleware = require('../middleware/authMiddleware');
const checkLimit = require('../middleware/checkLimit');

const { handleIncomingMessage } = require('../services/messageHandler');

// Message handler moved to services/messageHandler.js

// List all instances
router.get('/', authMiddleware, async (req, res) => {
  try {
    const organization_id = req.organization?.id;
    
    if (!organization_id) {
       return res.status(400).json({ error: 'Organization context required' });
    }

    const instances = await prisma.whatsAppInstance.findMany({
      where: { organization_id },
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

// Get instance by name (for onboarding polling)
router.get('/name/:name', authMiddleware, async (req, res) => {
  try {
    const { name } = req.params;
    const organization_id = req.organization?.id;

    const instance = await prisma.whatsAppInstance.findFirst({
      where: { 
        instance_name: name,
        organization_id 
      }
    });

    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    const qr = await getQRCode(instance.id);
    const connected = isConnected(instance.id);

    res.json({
      ...instance,
      qr,
      status: connected ? 'connected' : (instance.status || 'disconnected')
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ...

// Create new instance
router.post('/', authMiddleware, checkLimit('chatbots'), async (req, res) => {
  try {
    const { instance_name } = req.body;
    const organization_id = req.organization?.id;
    const user_email = req.user?.user_phone; // Linking by phone as per schema relation

    if (!instance_name) {
      return res.status(400).json({ error: 'instance_name is required' });
    }

    const instance = await prisma.whatsAppInstance.create({
      data: {
        instance_name,
        status: 'disconnected',
        organization_id, // Link to org
        user_email // Link to user
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
    const instance = await prisma.whatsAppInstance.delete({
      where: { id }
    });
    
    // Clean up session files
    if (instance) {
       await deleteSession(instance.instance_name);
    }

    res.json({ message: 'Instance deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
