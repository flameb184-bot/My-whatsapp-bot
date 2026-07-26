import pkg from 'whatsapp-web.js';
import express from 'express';
import qrcode from 'qrcode-terminal';

const { Client, LocalAuth } = pkg;

const app = express();
const PORT = process.env.PORT || 10000;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('authenticated', () => {
    console.log('Client authenticated');
});

client.initialize();

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
