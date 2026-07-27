import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import express from 'express';
import readline from 'readline';

const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(PORT);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        browser: ['Chrome', 'Windows', '1.0.0']
    });

    if (!sock.authState.creds.registered) {
        const phoneNumber = await question('\n\nENTER YOUR WHATSAPP NUMBER WITH COUNTRY CODE: \nExample: 254712345678\n> ');
        setTimeout(async () => {
            let code = await sock.requestPairingCode(phoneNumber.trim());
            code = code?.match(/.{1,4}/g)?.join('-') || code;
            console.log('\n\n🔥🔥 YOUR PAIRING CODE: ' + code + ' 🔥🔥');
            console.log('Go to WhatsApp > Linked Devices > Link with phone number\n\n');
        }, 3000);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log('✅ BOT IS ONLINE!');
            rl.close();
        }
        if (connection === 'close') setTimeout(startBot, 5000);
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (msg?.message?.conversation?.toLowerCase() === '!ping') {
            await sock.sendMessage(msg.key.remoteJid, { text: 'pong 🏓' });
        }
    });
}

startBot();
