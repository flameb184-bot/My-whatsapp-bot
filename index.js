import pkg from 'whatsapp-web.js';
import express from 'express';
import qrcode from 'qrcode-terminal';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

const { Client, LocalAuth } = pkg;

const app = express();
const PORT = process.env.PORT || 10000;

async function startBot() {
    const executablePath = await chromium.executablePath();
    
    const client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            executablePath: executablePath,
            args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            headless: chromium.headless,
        }
    });

    client.on('qr', (qr) => {
        console.log('QR RECEIVED');
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log('Client is ready!');
    });

    await client.initialize();
}

startBot();

app.get('/', (req, res) => res.send('Bot is running'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
