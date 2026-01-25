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

// Store reconnection attempts and timeouts
const reconnectionAttempts = new Map();
const reconnectionTimeouts = new Map();
const MAX_RECONNECTION_ATTEMPTS = 5;
const BASE_RECONNECTION_DELAY = 5000; // 5 seconds

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
          // Clear any existing reconnection timeout
          const existingTimeout = reconnectionTimeouts.get(instanceId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          // Get current attempt number
          const attempts = reconnectionAttempts.get(instanceId) || 0;

          if (attempts < MAX_RECONNECTION_ATTEMPTS) {
            // Calculate delay with exponential backoff
            const delay = BASE_RECONNECTION_DELAY * Math.pow(2, attempts);

            console.log(`⏳ Reconnecting in ${delay/1000}s (attempt ${attempts + 1}/${MAX_RECONNECTION_ATTEMPTS})...`);

            // Increment attempts
            reconnectionAttempts.set(instanceId, attempts + 1);

            // Schedule reconnection
            const timeout = setTimeout(() => {
              console.log(`🔄 Attempting reconnection for ${instance.instance_name}...`);
              startWhatsAppConnection(instanceId, onMessage).catch(err => {
                console.error(`Failed to reconnect ${instance.instance_name}:`, err.message);
              });
            }, delay);

            reconnectionTimeouts.set(instanceId, timeout);
          } else {
            console.log(`❌ Max reconnection attempts reached for ${instance.instance_name}. Giving up.`);
            reconnectionAttempts.delete(instanceId);
            reconnectionTimeouts.delete(instanceId);

            await prisma.whatsAppInstance.update({
              where: { id: instanceId },
              data: {
                status: 'disconnected',
                qr_code: null,
                phone_number: null
              }
            });
            activeConnections.delete(instanceId);
          }
        } else {
          // Logged out - clear credentials
          console.log(`🚪 Logged out from ${instance.instance_name}`);
          reconnectionAttempts.delete(instanceId);
          reconnectionTimeouts.delete(instanceId);

          await prisma.whatsAppInstance.update({
            where: { id: instanceId },
            data: {
              status: 'disconnected',
              qr_code: null,
              phone_number: null
            }
          });
          activeConnections.delete(instanceId);

          // Cleanup session files
          await deleteSession(instance.instance_name);
        }
      } else if (connection === 'open') {
        console.log(`✅ WhatsApp connected for instance: ${instance.instance_name}`);

        // Reset reconnection attempts on successful connection
        reconnectionAttempts.delete(instanceId);
        reconnectionTimeouts.delete(instanceId);

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
             mediaType = msg.message.imageMessage.mimetype || 'image/jpeg';
             console.log('📸 Image downloaded successfully, size:', mediaBuffer.length);
          } catch (err) {
             console.error('❌ Failed to download image:', err);
          }
        } else if (msg.message.audioMessage) {
           console.log('✅ Extracted from audioMessage');
           try {
              mediaBuffer = await downloadMediaMessage(
                 msg,
                 'buffer',
                 { },
                 { 
                   logger,
                   reuploadRequest: sock.updateMediaMessage
                 }
              );
              mediaType = msg.message.audioMessage.mimetype; // e.g. 'audio/ogg; codecs=opus'
              console.log(`🎤 Audio downloaded successfully, size: ${mediaBuffer.length}, type: ${mediaType}`);
           } catch (err) {
              console.error('❌ Failed to download audio:', err);
           }
        } else if (msg.message.documentMessage) {
            messageText = msg.message.documentMessage.caption || '';
            console.log('✅ Extracted from documentMessage (caption: ' + messageText + ')');
            try {
               mediaBuffer = await downloadMediaMessage(
                  msg,
                  'buffer',
                  { },
                  { 
                    logger,
                    reuploadRequest: sock.updateMediaMessage
                  }
               );
               mediaType = msg.message.documentMessage.mimetype;
               console.log(`📄 Document downloaded successfully, size: ${mediaBuffer.length}, type: ${mediaType}`);
            } catch (err) {
               console.error('❌ Failed to download document:', err);
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
  console.log(`🛑 Stopping connection for instance ${instanceId}...`);

  // Clear any pending reconnection timeouts
  const existingTimeout = reconnectionTimeouts.get(instanceId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
    reconnectionTimeouts.delete(instanceId);
  }

  // Reset reconnection attempts
  reconnectionAttempts.delete(instanceId);

  const sock = activeConnections.get(instanceId);

  if (sock) {
    try {
      await sock.logout();
    } catch (error) {
      console.log('Logout error (connection may already be closed):', error.message);
    }

    activeConnections.delete(instanceId);

    await prisma.whatsAppInstance.update({
      where: { id: instanceId },
      data: {
        status: 'disconnected',
        qr_code: null
      }
    });
  }

  console.log(`✅ Connection stopped for instance ${instanceId}`);
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
