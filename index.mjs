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
        browser: ['Render Bot', 'Chrome', '1.0.0']
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('\n========== SCAN THIS QR NOW ==========\n');
            qrcode.generate(qr, { small: true });
            console.log('\n======================================\n');
        }
        
        if (connection === 'open') {
            console.log('✅ BOT IS ONLINE AND READY!');
        }
        
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason!== DisconnectReason.loggedOut) {
                console.log('Connection closed, restarting in 3s...');
                setTimeout(startBot, 3000);
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && msg.message?.conversation) {
            const text = msg.message.conversation.toLowerCase();
            if (text === '!ping') {
                await sock.sendMessage(msg.key.remoteJid, { text: 'pong 🏓 from Render!' });
            }
        }
    });
}

startBot();
