const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function start() {
    console.log('Starting Baileys test...');
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_test');
    const { version } = await fetchLatestBaileysVersion();
    console.log(`Baileys version: ${version.join('.')}`);

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'info' }),
        printQRInTerminal: true,
        auth: state
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log('QR RECEIVED:', qr.substring(0, 20) + '...');
        }
        if (connection === 'close') {
            console.log('Connection closed');
        } else if (connection === 'open') {
            console.log('Connection opened');
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

start();
