const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const ngrok = require('ngrok');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');
dotenv.config();

const SHAPES_API_KEY = process.env.SHAPESINC_API_KEY;
const SHAPES_USERNAME = process.env.SHAPESINC_SHAPE_USERNAME;
const BOT_NAME = SHAPES_USERNAME || 'Bot';

if (!SHAPES_API_KEY || !SHAPES_USERNAME) {
    console.error(" Missing SHAPESINC_API_KEY or SHAPESINC_SHAPE_USERNAME in .env");
    process.exit(1);
}

const app = express();
let currentQr = null;

app.get('/', (_req, res) => {
    if (!currentQr) return res.send('QR not yet generated. Please wait...');
    qrcode.toDataURL(currentQr, (_err, url) => {
        res.send(`<img src="${url}"><p>Scan with WhatsApp</p>`);
    });
});

const PORT = 3000;
app.listen(PORT, async () => {
    const url = await ngrok.connect(PORT);
    console.log(`✅ QR Code Web Server is live: ${url}`);
});

const shapes = new OpenAI({
    apiKey: SHAPES_API_KEY,
    baseURL: 'https://api.shapes.inc/v1',
});

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--no-zygote',
            '--disable-extensions'
        ],
        headless: true
    }
});

client.on('qr', qr => {
    currentQr = qr;
    console.log(' QR Code received. Access it via your ngrok URL.');
});

client.on('ready', () => {
    console.log(`Client is ready! Logged in as ${client.info.wid.user}`);
});

client.on('authenticated', () => {
    console.log('Authenticated successfully');
});

client.on('auth_failure', msg => {
    console.error('Authentication failed:', msg);
});

client.on('disconnected', reason => {
    console.warn('Disconnected:', reason);
});

async function processWithShapes(content, userId, threadId) {
    if (!content || content.trim() === '') return "Please provide some text.";
    try {
        const headers = {
            "X-User-Id": userId,
            ...(threadId && { "X-Channel-Id": threadId }),
        };
        const response = await shapes.chat.completions.create({
            model: `shapesinc/${SHAPES_USERNAME}`,
            messages: [{ role: "user", content }],
        }, { headers });

        return response.choices[0]?.message?.content || "I didn't get that.";
    } catch (error) {
        console.error(' Shapes API Error:', error.message);
        return "AI failed to respond. Try again later.";
    }
}

function isDirectedToBot(msg, botInfo) {
    const messageBody = msg.body.toLowerCase().trim();
    const mentionedUsers = msg.mentionedIds || [];
    const isMentionedDirectly = mentionedUsers.includes(botInfo?.wid?._serialized);
    const botNameRegex = new RegExp(`\\b${BOT_NAME.toLowerCase()}\\b`);
    return isMentionedDirectly || botNameRegex.test(messageBody);
}

client.on('message', async (msg) => {
    if (msg.fromMe || !client.info) return;

    const chat = await msg.getChat();
    const messageBody = msg.body.toLowerCase().trim();
    const userId = msg.from;
    const threadId = chat.id._serialized;
    const isGroup = chat.isGroup;
    const isDirectMessage = !isGroup;

    if (messageBody === '!ping') return msg.reply('pong');

    if (messageBody.startsWith('!ask ')) {
        const query = msg.body.slice(5).trim();
        if (!query) return msg.reply("Please provide a query after `!ask`");
        await chat.sendStateTyping();
        const reply = await processWithShapes(query, userId, threadId);
        await chat.clearState();
        return msg.reply(reply);
    }

    if (isGroup && messageBody.startsWith('!shape ')) {
        const query = msg.body.slice(7).trim();
        if (!query) return msg.reply("Please provide a query after `!shape`");
        await chat.sendStateTyping();
        const reply = await processWithShapes(query, userId, threadId);
        await chat.clearState();
        return msg.reply(reply);
    }

    const isDirectlyAddressed = isDirectedToBot(msg, client.info);
    if (isDirectMessage || (isGroup && isDirectlyAddressed)) {
        let contentToProcess = msg.body;
        if (isGroup) {
            contentToProcess = contentToProcess.replace(new RegExp(`@${client.info.wid._serialized}`, 'gi'), '');
            contentToProcess = contentToProcess.replace(new RegExp(`\\b${BOT_NAME}\\b`, 'gi'), '').trim();
        }

        if (!contentToProcess) return;
        await chat.sendStateTyping();
        const reply = await processWithShapes(contentToProcess, userId, threadId);
        await chat.clearState();
        return msg.reply(reply);
    }
});

client.initialize();
