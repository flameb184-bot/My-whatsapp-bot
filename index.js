import crypto from 'crypto';
import { default as makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import express from 'express';
import { mkdirSync, existsSync } from 'fs';

if (!existsSync('sessions')) mkdirSync('sessions');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('sessions
