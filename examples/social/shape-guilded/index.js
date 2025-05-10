// Import required packages
const { Client } = require("guilded.js");
const axios = require("axios"); // For HTTP requests to the Shapes API
require("dotenv").config(); // To load environment variables from .env
const fs = require('fs'); // For file system operations

// --- Configuration ---
const guildedToken = process.env.GUILDED_TOKEN;
const shapesApiKey = process.env.SHAPES_API_KEY;
const shapeUsername = process.env.SHAPE_USERNAME; // The plain username

const SHAPES_API_BASE_URL = "https://api.shapes.inc/v1";
const SHAPES_MODEL_NAME = `shapesinc/${shapeUsername}`;

if (!guildedToken || !shapesApiKey || !shapeUsername) {
    console.error(
        "Error: Please ensure that GUILDED_TOKEN, SHAPES_API_KEY, and SHAPE_USERNAME are set in your .env file."
    );
    process.exit(1);
}

// Initialize Guilded Client
const client = new Client({ token: guildedToken });

// File path for storing active channels
const channelsFilePath = './active_channels.json';

// In-memory store for active channels (Channel IDs)
let activeChannels = new Set();

// Function to load active channels from file
function loadActiveChannels() {
    try {
        if (fs.existsSync(channelsFilePath)) {
            const data = fs.readFileSync(channelsFilePath, 'utf8');
            const loadedChannelIds = JSON.parse(data);
            if (Array.isArray(loadedChannelIds)) {
                activeChannels = new Set(loadedChannelIds);
                console.log(`Active channels loaded: ${loadedChannelIds.join(', ')}`);
            } else {
                console.warn("Invalid format in active_channels.json. Starting with empty channels.");
                activeChannels = new Set();
            }
        } else {
            console.log("No active_channels.json found. Starting with empty channels.");
            activeChannels = new Set();
        }
    } catch (error) {
        console.error("Error loading active channels:", error);
        activeChannels = new Set(); // Start with empty channels in case of error
    }
}

// Function to save active channels to file
function saveActiveChannels() {
    try {
        const channelIdsArray = Array.from(activeChannels);
        fs.writeFileSync(channelsFilePath, JSON.stringify(channelIdsArray, null, 2));
        console.log(`Active channels saved: ${channelIdsArray.join(', ')}`);
    } catch (error) {
        console.error("Error saving active channels:", error);
    }
}

const START_MESSAGE_ACTIVATE = () => `🤖 Hello! I am now active for **${shapeUsername}** in this channel. All messages here will be forwarded.`;
const START_MESSAGE_RESET = () => `🤖 The context for **${shapeUsername}** in this channel has been reset for you. You can start a new conversation.`;
const ALREADY_ACTIVE_MESSAGE = () => `🤖 I am already active in this channel for **${shapeUsername}**.`;
const NOT_ACTIVE_MESSAGE = () => `🤖 I am not active in this channel. Use \`/activate\` first.`;
const DEACTIVATE_MESSAGE = () => `🤖 I am no longer active for **${shapeUsername}** in this channel.`;

// Function to send a message to the Shapes API
async function sendMessageToShape(userId, channelId, content) {
    console.log(`[Shapes API] Sending message to ${SHAPES_MODEL_NAME}: User ${userId}, Channel ${channelId}, Content: "${content}"`);
    try {
        const response = await axios.post(
            `${SHAPES_API_BASE_URL}/chat/completions`,
            {
                model: SHAPES_MODEL_NAME,
                messages: [{ role: "user", content: content }],
            },
            {
                headers: {
                    Authorization: `Bearer ${shapesApiKey}`,
                    "Content-Type": "application/json",
                    "X-User-Id": userId,
                    "X-Channel-Id": channelId,
                },
                timeout: 50000, // 50 seconds timeout
            }
        );

        if (response.data && response.data.choices && response.data.choices.length > 0) {
            const shapeResponseContent = response.data.choices[0].message.content;
            console.log(`[Shapes API] Response received: "${shapeResponseContent}"`);
            return shapeResponseContent;
        } else {
            console.error("[Shapes API] Unexpected response structure:", response.data);
            return "Sorry, I couldn't get a clear response from the Shape.";
        }
    } catch (error) {
        console.error("[Shapes API] Error during communication:", error.response ? error.response.data : error.message);
        if (error.code === 'ECONNABORTED') {
            return "Sorry, the request to the Shape timed out.";
        }
        if (error.response && error.response.status === 429) {
            return "Too many requests to the Shapes API. Please try again later.";
        }
        return "Sorry, there was an error connecting to the Shape.";
    }
}

// Load active channels on startup
loadActiveChannels();

// Event handler for "ready"
client.on("ready", () => {
    console.log(`Bot logged in as ${client.user?.name}!`);
    console.log(`Ready to process messages for Shape: ${shapeUsername} (Model: ${SHAPES_MODEL_NAME}).`);
});

// Event handler for new messages
client.on("messageCreated", async (message) => {
    // Ignore messages from the bot itself or other bots
    if (message.createdById === client.user?.id || message.author?.type === "bot") {
        return;
    }

    // Ignore messages without content (e.g., embeds without text)
    if (!message.content || message.content.trim() === "") {
        return;
    }

    const commandPrefix = "/";
    const guildedUserName = message.author?.name || "Unknown User"; // Get username

    // Command handling
    if (message.content.startsWith(commandPrefix)) {
        const [command, ...args] = message.content.slice(commandPrefix.length).trim().split(/\s+/);
        const channelId = message.channelId;

        if (command.toLowerCase() === "activate") {
            if (activeChannels.has(channelId)) {
                await message.reply(ALREADY_ACTIVE_MESSAGE());
            } else {
                activeChannels.add(channelId);
                saveActiveChannels(); // Save after adding
                console.log(`Bot activated in channel: ${channelId}`);
                await message.reply(START_MESSAGE_ACTIVATE());
            }
            return;
        }

        if (command.toLowerCase() === "reset") {
            if (activeChannels.has(channelId)) {
                console.log(`Context reset initiated by User ${message.createdById} in channel: ${channelId}`);

                // The content of START_MESSAGE_RESET() is what the Shapes API will "detect"
                // as a signal to reset the conversation history.
                const resetSignalContent = START_MESSAGE_RESET();

                try {
                    // Send this message to the Shapes API.
                    // The API is expected to interpret this specific message content as a reset command
                    // for the given user (message.createdById) and channel (channelId).
                    await sendMessageToShape(message.createdById, channelId, resetSignalContent);
                    console.log(`Sent reset signal to Shapes API for channel ${channelId}, user ${message.createdById}`);

                    // After successfully signaling the API, inform the user in Guilded.
                    await message.reply(START_MESSAGE_RESET());
                } catch (error) {
                    console.error(`Error during context reset process for channel ${channelId}, user ${message.createdById}:`, error);
                    // Inform the user about the failure.
                    await message.reply("Sorry, there was an error trying to reset the context with the Shape.");
                }
            } else {
                await message.reply(NOT_ACTIVE_MESSAGE());
            }
            return;
        }

        if (command.toLowerCase() === "deactivate") { // Optional: Deactivation command
            if (activeChannels.has(channelId)) {
                activeChannels.delete(channelId);
                saveActiveChannels(); // Save after removing
                console.log(`Bot deactivated in channel: ${channelId}`);
                await message.reply(DEACTIVATE_MESSAGE());
            } else {
                await message.reply(NOT_ACTIVE_MESSAGE());
            }
            return;
        }
    }

    // If the channel is active and it's not a command message:
    if (activeChannels.has(message.channelId)) {
        const originalContent = message.content;
        // Prepend username to the actual message
        const contentForShape = `${guildedUserName}: ${originalContent}`;

        console.log(`Message from User ${message.createdById} (${guildedUserName}) in active channel ${message.channelId}: "${originalContent}"`);
        console.log(`Sending to Shape: "${contentForShape}"`); // Logging the modified message

        try {
            // Indicator that the bot is "typing" (optional, but nice)
            try {
                await client.rest.put(`/channels/${message.channelId}/typing`);
            } catch (typingError) {
                console.warn("[Typing Indicator] Error sending typing indicator:", typingError.message);
            }

            // The modified message (contentForShape) is sent to the API
            const shapeResponse = await sendMessageToShape(message.createdById, message.channelId, contentForShape);

            if (shapeResponse && shapeResponse.trim() !== "") {
                await message.reply(shapeResponse);
            } else {
                console.log("No valid response from Shapes API or response was empty.");
                // Optional: Inform user that no response came
                // await message.reply("I didn't receive a response.");
            }
        } catch (err) {
            console.error("Error sending response to Guilded:", err);
            // Send an error message to the channel if something goes wrong
            try {
                await message.reply("Oops, something went wrong while processing your message.");
            } catch (replyError) {
                console.error("Could not send error message to Guilded:", replyError);
            }
        }
    }
});

// Event handler for errors
client.on("error", (error) => {
    console.error("An error occurred in the Guilded Client:", error);
});

// Connect to Guilded
client.login(guildedToken);

console.log("Bot starting...");
