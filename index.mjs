import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(PORT);

// ⚠️ PUT YOUR NUMBER HERE
// Format: CountryCode + Number, NO + and NO spaces
const PHONE_NUMBER ='254110984858;

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        printQRInTerminal: false
    });

    // Request pairing code if not registered
    if (!sock.authState.creds.registered) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        try {
            const code = await sock.requestPairingCode(PHONE_NUMBER);
            console.log('\n\n━━━━━━━━━━━━━━');
            console.log(`🔥 YOUR PAIRING CODE: ${code} 🔥`);
            console.log('Go to: WhatsApp > Settings > Linked Devices > Link with phone number');
            console.log('━━━━━━━━━━━━━━\n\n');
        } catch (e) {
            console.log("Error getting code:", e);
        }
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') console.log('✅ BOT IS ONLINE!');
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
            console.log('Reconnecting in 5s...');
            if(shouldReconnect) setTimeout(startBot, 5000);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (msg?.message?.conversation?.toLowerCase() === '!ping') {
            await sock.sendMessage(msg.key.remoteJid, { text: 'pong 🏓 Bot is working!' });
        }
    });
}

startBot();
