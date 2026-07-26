const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. Web server so Render doesn't crash
app.get('/', (req, res) => {
  res.send('HELLO, WORLD! Bot is running ✅');
});

const { 
  default: makeWASocket, 
  useMultiFileAuthState, 
  DisconnectReason 
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');

const SESSION_FOLDER = './sessions';

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_FOLDER);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true, // Shows QR in Render logs
    logger: pino({ level: 'silent' }) // Keeps logs clean
  });

  // Save credentials
  sock.ev.on('creds.update', saveCreds);

  // Handle connection
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode!== DisconnectReason.loggedOut;
      console.log('Connection closed. Reconnecting...', shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('✅ Bot connected successfully!');
    }
  });

  // Handle messages
  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    const from = msg.key.remoteJid;

    if (text === '.ping') {
      await sock.sendMessage(from, { text: 'pong 🏓' });
    }
    if (text === '.menu') {
      await sock.sendMessage(from, { text: 'Hello! I am alive.\nCommands:\n.ping\n.menu' });
    }
  });
}

startBot();
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
