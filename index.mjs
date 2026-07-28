import makeWASocket from '@whiskeysockets/baileys';
import { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import express from 'express';
import pino from 'pino';

const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', function(req, res) { res.send('Bot is running'); });
app.listen(PORT, function() { console.log('Server running on port ' + PORT); });

// PUT YOUR NUMBER HERE
const PHONE_NUMBER = '254110984858';

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({ 
        version,
        logger: pino({ level: 'info' }),
        auth: state, 
        browser: ['Ubuntu','Chrome','20.0.04'], 
        printQRInTerminal: false 
    });

    // Request pairing code if not registered
    if (!sock.authState.creds.registered) {
        await new Promise(function(resolve) { setTimeout(resolve, 3000); });
        try {
            const code = await sock.requestPairingCode(PHONE_NUMBER);
            console.log('');
            console.log('=================================');
            console.log('YOUR PAIRING CODE: ' + code);
            console.log('Go to WhatsApp > Settings > Linked Devices > Link with phone number');
            console.log('=================================');
            console.log('');
        } catch (e) {
            console.log('Error getting code:', e);
        }
    }

    sock.ev.on('connection.update', function(update) {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log('BOT IS ONLINE AND CONNECTED');
        }
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode!== DisconnectReason.loggedOut;
            console.log('Connection closed. Reason:', lastDisconnect?.error, 'Reconnecting:', shouldReconnect);
            if(shouldReconnect) {
                setTimeout(startBot, 5000);
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async function(m) {
        if (!m.messages) return;
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const text = body.toLowerCase();

        console.log('Message from: ' + from + ' Text: ' + body);

        // COMMANDS
        if (text === '!ping') {
            await sock.sendMessage(from, { text: 'pong! Bot is working fine ✅' });
        }
        else if (text === '!menu') {
            await sock.sendMessage(from, { 
                text: `*BOT MENU*\n\n!ping - Test bot\n!menu - Show this menu\n!owner - Bot owner info\n\nBot is online` 
            });
        }
        else if (text === '!owner') {
            await sock.sendMessage(from, { text: 'This bot is running on Render 🚀' });
        }
        else if (text === 'hi' || text === 'hello') {
            await sock.sendMessage(from, { text: 'Hello! Type!menu to see commands' });
        }
    });
}

startBot();
