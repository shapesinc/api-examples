const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const express = require("express");
const ngrok = require("ngrok");
const { OpenAI } = require("openai");
const dotenv = require("dotenv");
dotenv.config();

const SHAPES_API_KEY = process.env.SHAPESINC_API_KEY;
const SHAPES_USERNAME = process.env.SHAPESINC_SHAPE_USERNAME;
// if there is more names for the bot please add the || and "bot name"
const BOT_NAME = SHAPES_USERNAME || "erza" || "erza scarlet";
// Free will instructions
const FREE_WILL_INSTRUCTIONS = process.env.FREE_WILL_INSTRUCTIONS;
// Free will settings
const LEVEL_OF_FREE_WILL =process.env.LEVEL_OF_FREE_WILL;
const DAILY_LEVEL_OF_FREE_WILL = process.env.DAILY_LEVEL_OF_FREE_WILL;
const FAVORITE_PEOPLE_STR = process.env.FAVORITE_PEOPLE;
const FAVORITE_PEOPLE = FAVORITE_PEOPLE_STR
    ? FAVORITE_PEOPLE_STR.split(',').map(item => item.trim()).filter(item => item)
    : [];
const KEYWORDS_OF_INTEREST_STR = process.env.KEYWORDS_OF_INTEREST;
const KEYWORDS_OF_INTEREST = KEYWORDS_OF_INTEREST_STR
    ? KEYWORDS_OF_INTEREST_STR.split(',').map(item => item.trim()).filter(item => item)
    : [];
const numberRecentMessages = process.env.numberRecentMessages;
const DAILY_TIME_CHECK = process.env.DAILY_TIME_CHECK;

if (!SHAPES_API_KEY || !SHAPES_USERNAME) {
console.error(" Missing SHAPESINC_API_KEY or SHAPESINC_SHAPE_USERNAME in .env",);
process.exit(1);
}

const app = express();
let currentQr = null;

app.get("/", (_req, res) => {
if (!currentQr) return res.send("QR not yet generated. Please wait...");
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
baseURL: "https://api.shapes.inc/v1",
});

const client = new Client({
authStrategy: new LocalAuth(),
puppeteer: {
args: [
"--no-sandbox",
"--disable-setuid-sandbox",
"--disable-gpu",
"--no-zygote",
"--disable-extensions",
],
headless: true,
},
});

client.on("qr", (qr) => {
currentQr = qr;
console.log(" QR Code received. Access it via your ngrok URL.");
});

client.on("ready", () => {
console.log(`Client is ready! Logged in as ${client.info.wid.user}`);

// Start the free will timer
setInterval(async () => {
await checkAndRespond();
}, DAILY_TIME_CHECK);
});

client.on("authenticated", () => {
console.log("Authenticated successfully");
});

client.on("auth_failure", (msg) => {
console.error("Authentication failed:", msg);
});

client.on("disconnected", (reason) => {
console.warn("Disconnected:", reason);
});

// Store chat histories
const chatHistories = {};

// Rate limiting
let requestQueue = [];
let isProcessing = false;

async function processWithShapes(
content,
userId,
threadId,
chatHistory,
instructions,
) {
return new Promise((resolve) => {
requestQueue.push(async () => {
try {
if (!content || content.trim() === "") {
resolve("Please provide some text.");
return;
}
const messages = chatHistory.map((message) => ({
role: message.author === userId ? "user" : "assistant",
content: message.body,
}));
messages.push({ role: "user", content });
const headers = {
"X-User-Id": userId,
...(threadId && { "X-Channel-Id": threadId }),
};
const response = await shapes.chat.completions.create(
{
model: `shapesinc/${SHAPES_USERNAME}`,
messages: messages,
},
{ headers },
);
resolve(response.choices[0]?.message?.content || "I didn't get that.");
} catch (error) {
console.error(" Shapes API Error:", error.message);
resolve(
"I couldn't understand your last request can you send it again?",
);
}
});
processQueue();
});
}
async function processQueue() {
if (isProcessing) return;
if (requestQueue.length === 0) return;
isProcessing = true;
const request = requestQueue.shift();
await request();
isProcessing = false;
// Process the next request after a delay
setTimeout(() => {
processQueue();
}, 12000); // Delay of 12 seconds to achieve 5 RPM
}
function isDirectedToBot(msg, botInfo) {
const messageBody = msg.body.toLowerCase().trim();
const mentionedUsers = msg.mentionedIds || [];
const isMentionedDirectly = mentionedUsers.includes(
botInfo?.wid?._serialized,
);
const botNameRegex = new RegExp(`^${BOT_NAME.toLowerCase()}[\\s\\?\\!\\.]`); // Bot name at the beginning, followed by space or punctuation
const isNameCalled = botNameRegex.test(messageBody);
console.log(`isDirectedToBot: messageBody=${messageBody}, isMentionedDirectly=${isMentionedDirectly}, isNameCalled=${isNameCalled}`);
return isMentionedDirectly || isNameCalled;
}
async function checkAndRespond() {
const chats = await client.getChats();
for (const chat of chats) {
if (chat.isGroup) {
const messages = await chat.fetchMessages({ limit: numberRecentMessages });
const recentMessages = messages;
if (recentMessages.length > 0) {
const lastMessage = recentMessages[numberRecentMessages -1];
const messageBody = lastMessage.body.toLowerCase().trim();
// Decision-making logic:
let shouldProactivelyRespond = false;
if (Math.random() < DAILY_LEVEL_OF_FREE_WILL && !lastMessage.fromMe) {
shouldProactivelyRespond = true;
}
console.log(`messageBody=${messageBody},lastMessage.fromMe=${lastMessage.fromMe},shouldProactivelyRespond=${shouldProactivelyRespond}, Math.random()=${Math.random()}, Math.random() < DAILY_LEVEL_OF_FREE_WILL =${Math.random() < DAILY_LEVEL_OF_FREE_WILL}`);
// Ensure the message is longer than 3 characters before responding
if (messageBody.length > 3 && shouldProactivelyRespond) {
// Generate a response
const userId = lastMessage.author;
const threadId = chat.id._serialized;
// Get chat history
const chatHistory = chatHistories[threadId] || [];
// Analyze chat history to understand the context
const context = analyzeChatHistory(chatHistory);
// Modify the prompt based on the context
let prompt = `The conversation is about: ${context || "nothing in particular"}. The last message was: ${messageBody}. Respond as Erza Scarlet, known for her strength, loyalty, and humor. ${FREE_WILL_INSTRUCTIONS}`;
const reply = await processWithShapes(
prompt,
userId,
threadId,
chatHistory,
FREE_WILL_INSTRUCTIONS,
);
// Send the response
await chat.sendStateTyping();
await chat.sendMessage(reply);
await chat.clearState();
}
}
}
}
}
function checkKeywords(messageBody, keywords) {
// Use regular expressions for more sophisticated keyword matching
const regex = new RegExp(keywords.join("|"), "i");
return regex.test(messageBody);
}
function analyzeChatHistory(chatHistory) {
if (chatHistory.length === 0) {
return null;
}
// Extract the last numberRecentMessages messages
const recentMessages = chatHistory
.slice(-numberRecentMessages)
.map((message) => message.body)
.join(" ");
console.log(`analyzeChatHistory: recentMessages=${recentMessages}`);
// Use keywords to identify the topic of the conversation
const keywords = KEYWORDS_OF_INTEREST;
const topic = KEYWORDS_OF_INTEREST.find((keyword) =>
recentMessages.includes(keyword.toLowerCase()),
);
console.log(`analyzeChatHistory: topic=${topic}`);
return topic || null;
}
client.on("message", async (msg) => {
if (msg.fromMe || !client.info) return;
const chat = await msg.getChat();
const chatId = chat.id._serialized;
// Store the message in the chat history
if (!chatHistories[chatId]) {
chatHistories[chatId] = [];
}
chatHistories[chatId].push({
author: msg.author,
body: msg.body,
timestamp: msg.timestamp,
});
// Limit the chat history to numberRecentMessages messages
const maxHistoryLength = numberRecentMessages;
if (chatHistories[chatId].length > maxHistoryLength) {
chatHistories[chatId].shift();
}
const messageBody = msg.body.toLowerCase().trim();
const userId = msg.author;
const threadId = chat.id._serialized;
const isGroup = chat.isGroup;
const isDirectMessage = !isGroup;
// Check if the message is a reply to the bot
const quotedMessage = await msg.getQuotedMessage();
const isReplyToBot = quotedMessage && quotedMessage.fromMe;
// Check if the bot's name is mentioned in the message
const botNameMentioned = messageBody.includes(BOT_NAME.toLowerCase());
if (messageBody.startsWith("!ask ")) {
const query = msg.body.slice(5).trim();
if (!query) return msg.reply("Please provide a query after `!ask`");
await chat.sendStateTyping();
const reply = await processWithShapes(
query,
userId,
threadId,
chatHistories[chatId],
FREE_WILL_INSTRUCTIONS,
);
await chat.clearState();
return msg.reply(reply);
}
if (isGroup && messageBody.startsWith("!shape ")) {
const query = msg.body.slice(7).trim();
if (!query) return msg.reply("Please provide a query after `!shape`");
await chat.sendStateTyping();
const reply = await processWithShapes(
query,
userId,
threadId,
chatHistories[chatId],
FREE_WILL_INSTRUCTIONS,
);
await chat.clearState();
return msg.reply(reply);
}
// Check if the message contains keywords of interest
const containsKeywords = checkKeywords(
messageBody,
KEYWORDS_OF_INTEREST,
);
// Check if the message is from a favorite person
const isFromFavoritePerson = FAVORITE_PEOPLE.includes(msg.author);
const isDirectlyAddressed = isDirectedToBot(msg, client.info);
if (
isDirectMessage ||
(isGroup && (isDirectlyAddressed || isReplyToBot || botNameMentioned || containsKeywords || (isFromFavoritePerson && (Math.random() < LEVEL_OF_FREE_WILL *2 )|| (Math.random() < LEVEL_OF_FREE_WILL) )
))) {
let contentToProcess = msg.body;
if (isGroup) {
contentToProcess = contentToProcess.replace(
new RegExp(`@${client.info.wid._serialized}`, "gi"),
"",
);
contentToProcess = contentToProcess
.replace(new RegExp(`\\b${BOT_NAME}\\b`, "gi"), "")
.trim();
}
if (!contentToProcess) return;
await chat.sendStateTyping();
const reply = await processWithShapes(
contentToProcess,
userId,
threadId,
chatHistories[chatId],
FREE_WILL_INSTRUCTIONS,
);
await chat.clearState();
return msg.reply(reply); // Reply directly to the message
}
console.log(`isDirectlyAddressed=${isDirectlyAddressed},isReplyToBot=${isReplyToBot},botNameMentioned=${botNameMentioned}, Math.random()=${Math.random()}, Math.random() < LEVEL_OF_FREE_WILL =${Math.random() < LEVEL_OF_FREE_WILL}, isFromFavoritePerson=${isFromFavoritePerson},msg=${msg},msg.author=${msg.author},FAVORITE_PEOPLE.includes(msg.author)=${FAVORITE_PEOPLE.includes(msg.author)}, FAVORITE_PEOPLE=${FAVORITE_PEOPLE}`);
});
client.on("message_create", async (message) => {
if (message.body === "!ping") {
const userId = message.author;
const chat = await message.getChat();
const threadId = chat.id._serialized;
const content = message.body;
const reply = await processWithShapes(
content,
userId,
threadId,
chatHistories[chatId],
FREE_WILL_INSTRUCTIONS,
);
message.reply(reply);
}
});
client.initialize();
