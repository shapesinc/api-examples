const path = require('path');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const axios = require('axios');

const envPath = path.resolve(__dirname, 'config.env');
const dotenvResult = dotenv.config({ path: envPath });

if (dotenvResult.error) {
    console.error('Failed to load config.env:', dotenvResult.error.message);
    process.exit(1);
}

const SHAPES_API_KEY = process.env.SHAPESINC_API_KEY;
const SHAPE_USERNAME = process.env.SHAPESINC_SHAPE_USERNAME;
const CORVY_BOT_TOKEN = process.env.CORVY_BOT_TOKEN;

if (!SHAPES_API_KEY || !SHAPE_USERNAME || !CORVY_BOT_TOKEN) {
    console.error('Missing environment variables. Check config.env.');
    process.exit(1);
}

const shapesClient = new OpenAI({
    apiKey: SHAPES_API_KEY,
    baseURL: 'https://api.shapes.inc/v1',
});

const commands = [
    '!ask', '!imagine', '!wack', '!reset', '!sleep',
    '!dashboard', '!info', '!web', '!help'
];

let lastCursor = 0;

async function pollMessages() {
    try {
        const { data } = await axios.get('https://corvy.chat/api/v1/messages', {
            headers: { Authorization: `Bearer ${CORVY_BOT_TOKEN}` },
            params: { cursor: lastCursor },
        });

        lastCursor = data.cursor;

        for (const message of data.messages) {
            if (message.user.is_bot) continue;

            const content = message.content.trim();
            const command = commands.find(cmd => content.toLowerCase().startsWith(cmd));

            if (!command) continue;

            const query = content.slice(command.length).trim();
            if (!query && command !== '!wack' && command !== '!reset' && command !== '!help') {
                await sendCorvyMessage(message, `Usage: ${command} [query]`);
                continue;
            }

            console.log(`Processing ${command} from ${message.user.username}: ${query || 'no query'}`);

            try {
                const response = await shapesClient.chat.completions.create({
                    model: SHAPE_USERNAME,
                    messages: [{ role: 'user', content }],
                    headers: {
                        'X-User-Id': message.user.id,
                        'X-Channel-Id': message.nest_id,
                    },
                });

                const responseContent = response.choices[0]?.message?.content;
                if (!responseContent) {
                    await sendCorvyMessage(message, 'No response from AI.');
                    continue;
                }

                const isImage = command === '!imagine' && responseContent.includes('http');
                const reply = isImage ? `Generated image: ${responseContent}` : responseContent;

                await sendCorvyMessage(message, reply);
                console.log(`Sent ${isImage ? 'image URL' : 'text'}: ${reply}`);
            } catch (error) {
                await handleError(error, message);
            }
        }
    } catch (error) {
        console.error('Polling error:', error.message);
    }

    setTimeout(pollMessages, 5000);
}

async function sendCorvyMessage(message, content) {
    try {
        await axios.post(
            `https://corvy.chat/api/v1/flocks/${message.flock_id}/nests/${message.nest_id}/messages`,
            { content },
            { headers: { Authorization: `Bearer ${CORVY_BOT_TOKEN}` } }
        );
    } catch (error) {
        console.error('Failed to send Corvy message:', error.message);
    }
}

async function handleError(error, message) {
    if (error.response?.status === 429) {
        const retryAfter = (error.response?.data?.retry_after || 10) * 1000;
        console.warn(`Rate limit hit. Retrying after ${retryAfter}ms`);
        await new Promise(resolve => setTimeout(resolve, retryAfter));
    } else if (error.response?.status === 401) {
        console.error('Authentication error:', error.message);
        await sendCorvyMessage(message, 'Authentication issue. Please contact the bot admin.');
    } else {
        console.error('Command error:', error.message);
        await sendCorvyMessage(message, 'Something went wrong. Please try again later.');
    }
}

console.log('Shapes bot successfully started!');
pollMessages();
