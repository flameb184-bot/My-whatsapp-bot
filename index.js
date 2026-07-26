const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot is running'));
app.listen(PORT, () => console.log(`Server running on ${PORT}`));


const { default: makeWASocket, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');

const fs = require('fs');
const path = require('path');

const SESSION_FOLDER = './sessions';

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_FOLDER);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true // This shows QR in Railway logs
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode!== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting...', shouldReconnect);
            if(shouldReconnect) startBot();
        } else if(connection === 'open') {
            console.log('Bot connected successfully!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        const from = msg.key.remoteJid;

        if (text === '.ping') {
            await sock.sendMessage(from, { text: 'pong 🏓' });
        }
        if (text === '.menu') {
            await sock.sendMessage(from, { text: 'Hello! I am alive. Commands:.ping.menu' });
        }
    });
}

startBot();
