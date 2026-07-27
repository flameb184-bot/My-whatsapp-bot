import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        browser: ['Render Bot', 'Chrome', '1.0.0'],
        printQRInTerminal: false // we print manually
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('\n>>>>>>>>>> SCAN QR NOW <<<<<<<<<<\n');
            qrcode.generate(qr, { small: true });
        }
        
        if (connection === 'open') {
            console.log('✅ BOT IS ONLINE!');
        }
        
        if (connection === 'close') {
            console.log('Connection closed, restarting...');
            startBot();
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && msg.message?.conversation === '!ping') {
            await sock.sendMessage(msg.key.remoteJid, { text: 'pong 🏓' });
        }
    });
}

startBot();
