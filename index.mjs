import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Bot is running - Go to Logs to see QR'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        browser: ['Render Bot', 'Chrome', '1.0.0']
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('\n\n🔥 SCAN THIS QR WITH WHATSAPP NOW 🔥🔥');
            console.log('You have 20 seconds\n');
            qrcode.generate(qr, { small: true });
            console.log('\n🔥 SCAN IT NOW 🔥🔥🔥\n\n');
        }
        
        if (connection === 'open') {
            console.log('✅ SUCCESS! BOT IS LINKED AND ONLINE');
        }
        
        if (connection === 'close') {
            console.log('❌ Connection closed. Will retry in 5 seconds...');
            setTimeout(startBot, 5000);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && msg.message?.conversation === '!ping') {
            await sock.sendMessage(msg.key.remoteJid, { text: 'pong 🏓 Bot is working!' });
        }
    });
}

startBot();
