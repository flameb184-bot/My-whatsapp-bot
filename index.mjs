import makeWASocket from '@whiskeysockets/baileys';
import { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', function(req, res) { res.send('Bot is running'); });
app.listen(PORT);

const PHONE_NUMBER = '254110984858;

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({ auth: state, browser: ['Ubuntu','Chrome','20.0.04'], printQRInTerminal: false });

    if (!sock.authState.creds.registered) {
        await new Promise(function(resolve) { setTimeout(resolve, 3000); });
        try {
            const code = await sock.requestPairingCode(PHONE_NUMBER);
            console.log('');
            console.log('YOUR PAIRING CODE: ' + code);
            console.log('Go to WhatsApp Settings > Linked Devices > Link with phone number');
            console.log('');
        } catch (e) {
            console.log('Error getting code:', e);
        }
    }

    sock.ev.on('connection.update', function(update) {
        const connection = update.connection;
        const lastDisconnect = update.lastDisconnect;
        if (connection === 'open') console.log('BOT IS ONLINE');
        if (connection === 'close') {
            console.log('Reconnecting in 5s');
            setTimeout(startBot, 5000);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async function(m) {
        const msg = m.messages[0];
        if (msg && msg.message && msg.message.conversation === '!ping') {
            await sock.sendMessage(msg.key.remoteJid, { text: 'pong Bot is working' });
        }
    });
}

startBot();
