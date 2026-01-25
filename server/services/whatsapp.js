const makeWASocket = require('@whiskeysockets/baileys').default;
const { 
  DisconnectReason, 
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  downloadMediaMessage
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Store active connections
const activeConnections = new Map();

// Logger configuration
const logger = pino({ level: 'info' }); // Set to 'debug' for verbose logging

/**
 * Start a WhatsApp connection for a given instance
 */
async function startWhatsAppConnection(instanceId, onMessage) {
  try {
    const instance = await prisma.whatsAppInstance.findUnique({
      where: { id: instanceId }
    });

    if (!instance) {
      throw new Error('Instance not found');
    }

    // Create auth directory for this instance
    const authDir = path.join(__dirname, '../.auth', instance.instance_name);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    // Load auth state
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    // Create socket connection
    const sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false, // We'll handle QR code ourselves
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      browser: ['FinanceIA', 'Chrome', '1.0.0'],
    });

    // Store connection
    activeConnections.set(instanceId, sock);

    // Update instance status
    await prisma.whatsAppInstance.update({
      where: { id: instanceId },
      data: { status: 'connecting' }
    });

    // Handle QR code
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log(`📱 QR Code generated for instance: ${instance.instance_name}`);
        console.log('QR Length:', qr.length);
        
        try {
          // Store QR code in database
          await prisma.whatsAppInstance.update({
            where: { id: instanceId },
            data: { 
              qr_code: qr,
              status: 'connecting'
            }
          });
          console.log('✅ QR Code saved to DB');
        } catch (error) {
          console.error('❌ Error saving QR code to DB:', error);
        }
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error instanceof Boom)
          ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
          : true;

        console.log('Connection closed. Reconnect:', shouldReconnect);

        if (shouldReconnect) {
          // Reconnect after 5 seconds
          setTimeout(() => startWhatsAppConnection(instanceId, onMessage), 5000);
        } else {
          // Logged out - clear auth
          await prisma.whatsAppInstance.update({
            where: { id: instanceId },
            data: { 
              status: 'disconnected',
              qr_code: null,
              phone_number: null
            }
          });
          activeConnections.delete(instanceId);
          
          // Cleanup session files to prevent corruption loops
          await deleteSession(instance.instance_name);
        }
      } else if (connection === 'open') {
        console.log(`✅ WhatsApp connected for instance: ${instance.instance_name}`);
        const phoneNumber = sock.user?.id?.split(':')[0] || null;
        
        await prisma.whatsAppInstance.update({
          where: { id: instanceId },
          data: { 
            status: 'connected',
            qr_code: null,
            phone_number: phoneNumber
          }
        });
      }
    });

    // Save credentials when updated
    sock.ev.on('creds.update', saveCreds);

    // Handle incoming messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      console.log(`🔔 Messages event - Type: ${type}, Count: ${messages.length}`);
      
      for (const msg of messages) {
        console.log('📨 Raw message received:', {
          hasMessage: !!msg.message,
          fromMe: msg.key.fromMe,
          remoteJid: msg.key.remoteJid,
          messageKeys: msg.message ? Object.keys(msg.message) : []
        });

        if (!msg.message) {
          console.log('⏭️  Skipping - no message content');
          continue;
        }
        
        // Ignorar mensagens enviadas pelo próprio bot para evitar loop
        if (msg.key.fromMe) {
          console.log('⏭️  Skipping - message from me');
          continue;
        }

        const from = msg.key.remoteJid;

        // Ignore groups and broadcasts
        if (from.endsWith('@g.us') || from.endsWith('@broadcast')) {
           // console.log(`⏭️  Skipping - group/broadcast message from ${from}`);
           continue;
        }
        
        // Extract message text and media
        let messageText = '';
        let mediaBuffer = null;
        let mediaType = null;

        if (msg.message.conversation) {
          messageText = msg.message.conversation;
          console.log('✅ Extracted from conversation');
        } else if (msg.message.extendedTextMessage?.text) {
          messageText = msg.message.extendedTextMessage.text;
          console.log('✅ Extracted from extendedTextMessage');
        } else if (msg.message.imageMessage) {
          messageText = msg.message.imageMessage.caption || ''; // Caption is optional
          console.log('✅ Extracted from imageMessage (caption: ' + messageText + ')');
          
          try {
             // Download the image
             mediaBuffer = await downloadMediaMessage(
                msg,
                'buffer',
                { },
                { 
                  logger,
                  reuploadRequest: sock.updateMediaMessage
                }
             );
             mediaType = 'image/jpeg'; // Assuming JPEG for WhatsApp images usually
             console.log('📸 Image downloaded successfully, size:', mediaBuffer.length);
          } catch (err) {
             console.error('❌ Failed to download image:', err);
          }
        } else if (msg.message.videoMessage?.caption) {
          messageText = msg.message.videoMessage.caption;
          console.log('✅ Extracted from videoMessage caption');
        } else {
          console.log('⚠️  No text content found in message');
          console.log('🔍 Full msg.message:', JSON.stringify(msg.message, null, 2));
        }

        // Allow processing if there is text OR media
        if (!messageText && !mediaBuffer) {
          console.log('⏭️  Skipping - no text or media extracted');
          continue;
        }

        console.log(`📩 Message from ${from}: ${messageText} ${mediaBuffer ? '[+Image]' : ''}`);

        // Call the message handler
        if (onMessage) {
          await onMessage({
            from,
            message: messageText || '', // Ensure string if empty
            media: mediaBuffer,
            mediaType,
            instanceName: instance.instance_name,
            sock
          });
        }
      }
    });

    return sock;
  } catch (error) {
    console.error('Error starting WhatsApp connection:', error);
    throw error;
  }
}

/**
 * Send a WhatsApp message
 */
async function sendWhatsAppMessage(instanceId, to, message) {
  const sock = activeConnections.get(instanceId);
  
  if (!sock) {
    throw new Error('Instance not connected');
  }

  // Format phone number (ensure it has @s.whatsapp.net)
  const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;

  await sock.sendMessage(jid, { text: message });
  console.log(`✉️ Message sent to ${to}`);
}

/**
 * Stop a WhatsApp connection
 */
async function stopWhatsAppConnection(instanceId) {
  const sock = activeConnections.get(instanceId);
  
  if (sock) {
    await sock.logout();
    activeConnections.delete(instanceId);
    
    await prisma.whatsAppInstance.update({
      where: { id: instanceId },
      data: { 
        status: 'disconnected',
        qr_code: null
      }
    });
  }
}

/**
 * Get QR code for an instance
 */
async function getQRCode(instanceId) {
  const instance = await prisma.whatsAppInstance.findUnique({
    where: { id: instanceId }
  });

  return instance?.qr_code || null;
}

/**
 * Check if instance is connected
 */
function isConnected(instanceId) {
  const sock = activeConnections.get(instanceId);
  return sock && sock.user ? true : false;
}

/**
 * Delete session data
 */
async function deleteSession(instanceName) {
  const authDir = path.join(__dirname, '../.auth', instanceName);
  if (fs.existsSync(authDir)) {
    try {
      fs.rmSync(authDir, { recursive: true, force: true });
      console.log(`🗑️ Auth directory deleted for: ${instanceName}`);
    } catch (error) {
      console.error(`❌ Error deleting auth directory: ${error.message}`);
    }
  }
}

module.exports = {
  startWhatsAppConnection,
  sendWhatsAppMessage,
  stopWhatsAppConnection,
  getQRCode,
  isConnected,
  activeConnections,
  deleteSession
};
