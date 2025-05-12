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

// --- Message Constants ---
const START_MESSAGE_ACTIVATE = () => `🤖 Hello! I am now active for **${shapeUsername}** in this channel. All messages here will be forwarded.`;
const START_MESSAGE_RESET = () => `🤖 The long-term memory for **${shapeUsername}** in this channel has been reset for you. You can start a new conversation.`;
const ALREADY_ACTIVE_MESSAGE = () => `🤖 I am already active in this channel for **${shapeUsername}**.`;
const NOT_ACTIVE_MESSAGE = () => `🤖 I am not active in this channel. Use \`/activate\` first.`;
const DEACTIVATE_MESSAGE = () => `🤖 I am no longer active for **${shapeUsername}** in this channel.`;

// --- Media URL Handling ---
const MEDIA_EXTENSIONS = [
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', // images
    '.mp4', '.webm', '.mov', // videos
    '.mp3', '.ogg', '.wav'  // audio
];

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'];
const AUDIO_EXTENSIONS = ['.mp3', '.ogg', '.wav'];

function getMediaType(url) {
    if (typeof url !== 'string') return null;
    try {
        if (!url.toLowerCase().startsWith('http://') && !url.toLowerCase().startsWith('https://')) {
            return null;
        }
        const parsedUrl = new URL(url);
        const path = parsedUrl.pathname.toLowerCase();
        const pathOnly = path.split('?')[0].split('#')[0];

        if (IMAGE_EXTENSIONS.some(ext => pathOnly.endsWith(ext))) return 'image';
        if (VIDEO_EXTENSIONS.some(ext => pathOnly.endsWith(ext))) return 'video';
        if (AUDIO_EXTENSIONS.some(ext => pathOnly.endsWith(ext))) return 'audio';
        return null;
    } catch (e) {
        return null;
    }
}

function formatShapeResponseForGuilded(shapeResponse) {
    if (typeof shapeResponse !== 'string' || shapeResponse.trim() === "") {
        return { content: shapeResponse }; // Return original if empty or not string
    }

    const lines = shapeResponse.split('\n');
    let mediaUrl = null;
    let contentLines = [];
    let mediaUrlFoundAndProcessed = false;

    // Iterate backwards to find the last media URL, assuming it's often at the end
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        // Attempt to unwrap if it's like <url>
        const unwrappedLine = line.startsWith('<') && line.endsWith('>')
                            ? line.substring(1, line.length - 1)
                            : line;
        
        const mediaType = getMediaType(unwrappedLine);

        if (mediaType) {
            mediaUrl = unwrappedLine;
            // Assume lines before this one are content, if this is the *last* line and a media URL
            if (i === lines.length - 1) {
                contentLines = lines.slice(0, i);
            } else {
                // If media URL is in the middle, things get complex.
                // For now, let's prioritize the case where media URL is the last distinct part.
                // Or if the entire message is just the URL.
                // This logic might need refinement for URLs embedded mid-text.
                // For simplicity, if a media URL is found, we take all *other* lines as content.
                contentLines = lines.filter((_, index) => index !== i);
            }
            mediaUrlFoundAndProcessed = true;
            break; 
        }
    }

    let messageContent = shapeResponse; // Default to original response
    const embeds = [];

    if (mediaUrlFoundAndProcessed) {
        messageContent = contentLines.join('\n').trim();
        const mediaType = getMediaType(mediaUrl); // Get type of the final chosen mediaUrl

        if (mediaType === 'image' && mediaUrl) {
            embeds.push({ image: { url: mediaUrl } });
            // If there's no other textual content, just send the embed
            if (messageContent === "") {
                return { embeds };
            }
            return { content: messageContent, embeds };
        } else if ((mediaType === 'audio' || mediaType === 'video') && mediaUrl) {
            // For audio/video, append the URL to the content for Guilded to auto-embed
            if (messageContent === "") {
                messageContent = mediaUrl;
            } else {
                messageContent += '\n' + mediaUrl;
            }
            return { content: messageContent }; // No special 'embeds' object
        }
        // If mediaUrl was found but type is null (shouldn't happen if getMediaType is robust)
        // or if it's some other type we don't explicitly handle with embeds,
        // fall through to default behavior (send original content or content + URL).
        // This case should ideally be covered by the logic above.
        // If messageContent became just the URL, that's fine.
        if (messageContent === "" && mediaUrl) { // e.g. if only a non-image media URL was sent
             return { content: mediaUrl };
        }
        // If there was text and a non-image media URL, it's already appended to messageContent
        return { content: messageContent };
    }

    // No specific media URL found to make a special embed, send original content
    return { content: shapeResponse };
}

// --- Shapes API Command Configuration ---
// These are Shapes API commands that might not return a verbose reply.
// The bot will provide a generic confirmation if the Shape's response is empty.
// Note: !reset has its own custom confirmation message (START_MESSAGE_RESET).
const SHAPES_COMMANDS_WITH_POTENTIALLY_SILENT_SUCCESS = ["!sleep", "!wack"];


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
                timeout: 60000, // 60 seconds timeout (increased for potentially longer commands like !imagine)
            }
        );

        if (response.data && response.data.choices && response.data.choices.length > 0) {
            const shapeResponseContent = response.data.choices[0].message.content;
            console.log(`[Shapes API] Response received: "${shapeResponseContent}"`);
            return shapeResponseContent;
        } else {
            console.warn("[Shapes API] Unexpected response structure or empty choices:", response.data);
            return ""; // Return empty string for consistent handling
        }
    } catch (error) {
        console.error("[Shapes API] Error during communication:", error.response ? error.response.data : error.message);
        if (error.code === 'ECONNABORTED' || error.message.toLowerCase().includes('timeout')) {
            return "Sorry, the request to the Shape timed out.";
        }
        if (error.response && error.response.status === 429) {
            return "Too many requests to the Shapes API. Please try again later.";
        }
        // For other errors, throw it so processShapeApiCommand can catch and give a generic error to user
        throw error;
    }
}

// Helper function for processing Shapes API commands from Guilded commands
async function processShapeApiCommand(guildedMessage, guildedCommandName, baseShapeCommand, requiresArgs = false, commandArgs = []) {
    const channelId = guildedMessage.channelId;
    const userId = guildedMessage.createdById;

    if (!activeChannels.has(channelId)) {
        await guildedMessage.reply(NOT_ACTIVE_MESSAGE());
        return;
    }

    let fullShapeCommand = baseShapeCommand;
    if (requiresArgs) {
        const argString = commandArgs.join(" ");
        if (!argString) {
            await guildedMessage.reply(`Please provide the necessary arguments for \`/${guildedCommandName}\`. Example: \`/${guildedCommandName} your arguments\``);
            return;
        }
        fullShapeCommand = `${baseShapeCommand} ${argString}`;
    }

    console.log(`[Bot Command: /${guildedCommandName}] Sending to Shape API: User ${userId}, Channel ${channelId}, Content: "${fullShapeCommand}"`);
    try {
        // Typing indicator
        try {
            await client.rest.put(`/channels/${channelId}/typing`);
        } catch (typingError) {
            console.warn(`[Typing Indicator] Error for /${guildedCommandName}:`, typingError.message);
        }

        // Send the command to Shapes API
        const shapeResponse = await sendMessageToShape(userId, channelId, fullShapeCommand);

        // Handle response
        if (shapeResponse && shapeResponse.trim() !== "") {
            const replyPayload = formatShapeResponseForGuilded(shapeResponse);
            // If Shape API returned an error message (like timeout or rate limit from sendMessageToShape), display it
            // These error messages from sendMessageToShape are plain strings.
            if (typeof replyPayload.content === 'string' && (replyPayload.content.startsWith("Sorry,") || replyPayload.content.startsWith("Too many requests"))) {
                await guildedMessage.reply(replyPayload.content);
            } else {
                await guildedMessage.reply(replyPayload);
            }
        } else {
            // Shape's response was empty or just whitespace
            if (baseShapeCommand === "!reset") {
                await guildedMessage.reply(START_MESSAGE_RESET());
            } else if (SHAPES_COMMANDS_WITH_POTENTIALLY_SILENT_SUCCESS.includes(baseShapeCommand)) {
                await guildedMessage.reply(`The command \`/${guildedCommandName}\` has been sent to **${shapeUsername}**. It may have been processed silently.`);
            } else {
                // For commands expected to give a response (e.g., !info, !help, !web, !imagine, !dashboard)
                await guildedMessage.reply(`**${shapeUsername}** didn't provide a specific textual response for \`/${guildedCommandName}\`. The action might have been completed, or it may require a different interaction.`);
            }
        }
    } catch (error) { // Catches errors thrown by sendMessageToShape (e.g., network issues not handled as string returns)
        console.error(`[Bot Command: /${guildedCommandName}] Error during Shapes API call or Guilded reply:`, error);
        await guildedMessage.reply(`Sorry, there was an error processing your \`/${guildedCommandName}\` command with **${shapeUsername}**.`);
    }
}


// Load active channels on startup
loadActiveChannels();

// Event handler for "ready"
client.on("ready", () => {
    console.log(`Bot logged in as ${client.user?.name}!`);
    console.log(`Ready to process messages for Shape: ${shapeUsername} (Model: ${SHAPES_MODEL_NAME}).`);
    console.log(`Active channels on startup: ${Array.from(activeChannels).join(', ') || 'None'}`);
});

// Event handler for new messages
client.on("messageCreated", async (message) => {
    if (message.createdById === client.user?.id || message.author?.type === "bot") {
        return;
    }
    if (!message.content || message.content.trim() === "") {
        return;
    }

    const commandPrefix = "/";
    const guildedUserName = message.author?.name || "Unknown User";

    if (message.content.startsWith(commandPrefix)) {
        const [command, ...args] = message.content.slice(commandPrefix.length).trim().split(/\s+/);
        const lowerCaseCommand = command.toLowerCase();
        const channelId = message.channelId; // For activate/deactivate logic
        // userId is sourced within processShapeApiCommand from message.createdById

        // Bot-specific commands
        if (lowerCaseCommand === "activate") {
            if (activeChannels.has(channelId)) {
                await message.reply(ALREADY_ACTIVE_MESSAGE());
            } else {
                activeChannels.add(channelId);
                saveActiveChannels();
                console.log(`Bot activated in channel: ${channelId}`);
                await message.reply(START_MESSAGE_ACTIVATE());
            }
            return;
        }

        if (lowerCaseCommand === "deactivate") {
            if (activeChannels.has(channelId)) {
                activeChannels.delete(channelId);
                saveActiveChannels();
                console.log(`Bot deactivated in channel: ${channelId}`);
                await message.reply(DEACTIVATE_MESSAGE());
            } else {
                await message.reply(NOT_ACTIVE_MESSAGE());
            }
            return;
        }

        // Shapes API commands (will check for active channel inside processShapeApiCommand)
        switch (lowerCaseCommand) {
            case "reset": // Resets Shape's long-term memory for the channel/user
                await processShapeApiCommand(message, "reset", "!reset");
                break;
            case "sleep": // Triggers Shape's long-term memory generation
                await processShapeApiCommand(message, "sleep", "!sleep");
                break;
            case "dashboard": // Gets link to Shape's configuration dashboard
                await processShapeApiCommand(message, "dashboard", "!dashboard");
                break;
            case "info": // Gets Shape's information
                await processShapeApiCommand(message, "info", "!info");
                break;
            case "web": // Searches the web via the Shape
                await processShapeApiCommand(message, "web", "!web", true, args);
                break;
            case "help": // Gets Shape's help for its commands
                await processShapeApiCommand(message, "help", "!help");
                break;
            case "imagine": // Generates images via the Shape
                await processShapeApiCommand(message, "imagine", "!imagine", true, args);
                break;
            case "wack": // Resets Shape's short-term memory
                await processShapeApiCommand(message, "wack", "!wack");
                break;
            default:
                // If the channel is active and it's an unknown slash command,
                // you might choose to inform the user or ignore it.
                // For now, if it's not a recognized command, it won't be processed further by this block.
                // If activeChannels.has(message.channelId) is true, and it wasn't a command,
                // it will fall through to the regular message forwarding logic.
                // However, since it starts with "/", it's unlikely to be intended for the Shape as a normal message.
                if (activeChannels.has(message.channelId)) {
                     // message.reply(`Unknown command: \`/${command}\`. Try \`/help\` if you need assistance with the Shape's commands, or ensure the bot is active with \`/activate\`.`);
                }
                // If not active, it will just be ignored, which is fine.
                return; // Important: stop processing if it was a command attempt
        }
        return; // Ensure command processing stops here
    }

    // If the channel is active and it's not a command message:
    if (activeChannels.has(message.channelId)) {
        const originalContent = message.content;
        const userId = message.createdById;
        const contentForShape = `${guildedUserName}: ${originalContent}`;

        console.log(`[Regular Message] User ${userId} (${guildedUserName}) in active channel ${message.channelId}: "${originalContent}"`);
        console.log(`[Regular Message] Sending to Shape: "${contentForShape}"`);

        try {
            try {
                await client.rest.put(`/channels/${message.channelId}/typing`);
            } catch (typingError) {
                console.warn("[Typing Indicator] Error sending typing indicator:", typingError.message);
            }

            const shapeResponse = await sendMessageToShape(userId, message.channelId, contentForShape);

            if (shapeResponse && shapeResponse.trim() !== "") {
                const replyPayload = formatShapeResponseForGuilded(shapeResponse);
                 if (typeof replyPayload.content === 'string' && (replyPayload.content.startsWith("Sorry,") || replyPayload.content.startsWith("Too many requests"))) {
                    await message.reply(replyPayload.content); // Display API-side error messages
                } else {
                    await message.reply(replyPayload);
                }
            } else {
                console.log("[Regular Message] No valid response from Shapes API or response was empty.");
                // Optionally, you can inform the user if the Shape doesn't reply
                // await message.reply(`**${shapeUsername}** didn't send a reply.`);
            }
        } catch (err) { // Catches errors from sendMessageToShape if it throws
            console.error("[Regular Message] Error sending message to Shape or response to Guilded:", err);
            try {
                await message.reply("Oops, something went wrong while trying to talk to the Shape.");
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
