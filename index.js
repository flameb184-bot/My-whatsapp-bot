const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode-terminal');

const app = express();
const PORT = process.env.PORT || 10000;

const client = new Client({
    authStrategy: new LocalAuth()
});

// When QR is generated
client.on('qr', (qr) => {
    console.log('QR RECEIVED');
    qrcode.generate(qr, { small: true });
});

// When client is ready
client.on('ready', () => {
    console.log('Client is ready!');
});

// Start the client
client.initialize();

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
