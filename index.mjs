import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Bot is running. Check Logs for QR'));
app.listen(PORT);

let sock;
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    sock = makeWASocket({
        auth: state,
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        qrTimeout: 60000 // give 60s to scan
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        
        if (qr) {
            console.log('\n\n');
            console.log('━━━━━━━━');
            console.log(' SCAN THIS QR NOW - 60 SECONDS ');
            console.log('━━━━━━━━');
            qrcode.generate(qr, { small: false }); // bigger QR
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n\n\n');
        }
        
        if (connection === 'open') {
            console.log('✅ BOT IS ONLINE!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (msg?.message?.conversation?.toLowerCase() === '!ping') {
            await sock.sendMessage(msg.key.remoteJid, { text: 'pong 🏓' });
        }
    });
}

// Wait 3 seconds before starting so logs are ready
setTimeout(startBot, 3000);
