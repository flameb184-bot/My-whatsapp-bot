import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state
        // REMOVED printQRInTerminal here
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        if (qr) {
            console.log('QR RECEIVED - SCAN THIS NOW:');
            qrcode.generate(qr, { small: true }); // THIS prints it
        }
        if (connection === 'open') {
            console.log('Client is ready!');
        }
        if (connection === 'close') {
            console.log('Connection closed, restarting...');
            startBot();
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && msg.message?.conversation === '!ping') {
            sock.sendMessage(msg.key.remoteJid, { text: 'pong' });
        }
    });
}

startBot();
