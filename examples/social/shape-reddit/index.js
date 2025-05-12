const dotenv = require('dotenv');
dotenv.config();

const SHAPES_API_KEY = process.env.SHAPESINC_API_KEY;
const SHAPES_USERNAME = process.env.SHAPESINC_SHAPE_USERNAME;
const SUBREDDIT = process.env.REDDIT_SUBREDDIT;
const POLL_TIME = parseInt(process.env.POLL_TIME, 10) || 2000; // Default to 2 seconds
const LIMIT = parseInt(process.env.LIMIT, 10) || 10; // Default to 10 items
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES, 10) || 3; // Default to 3 retries
const RETRY_DELAY = parseInt(process.env.RETRY_DELAY, 10) || 5000; // Default to 5 seconds

// Dependencies
const Snoowrap = require('snoowrap');
const { CommentStream } = require('snoostorm');
const { OpenAI } = require('openai');

const requiredVars = [
  { name: 'SHAPES_API_KEY', value: SHAPES_API_KEY },
  { name: 'SHAPES_USERNAME', value: SHAPES_USERNAME },
  { name: 'REDDIT_SUBREDDIT', value: SUBREDDIT },
  { name: 'REDDIT_CLIENT_ID', value: process.env.REDDIT_CLIENT_ID },
  { name: 'REDDIT_CLIENT_SECRET', value: process.env.REDDIT_CLIENT_SECRET },
  { name: 'REDDIT_USERNAME', value: process.env.REDDIT_USERNAME },
  { name: 'REDDIT_PASSWORD', value: process.env.REDDIT_PASSWORD }
];

for (const { name, value } of requiredVars) {
  if (!value) {
    console.error(`${name} not found in environment variables!`);
    process.exit(1);
  }
}

const shapes = new OpenAI({
  apiKey: SHAPES_API_KEY,
  baseURL: "https://api.shapes.inc/v1"
});

/**
 * Process content with Shapes API with retry logic
 * @param {string} content - Content to process
 * @param {string} userId - User ID for tracking
 * @param {string} channelId - Channel ID for tracking
 * @returns {Promise<string>} - Response from Shapes API
 */
async function processWithShapes(content, userId, channelId) {
  let retries = 0;
  
  while (retries <= MAX_RETRIES) {
    try {
      console.log(`[Shapes] Sending request to API (attempt ${retries + 1}/${MAX_RETRIES + 1})`);
      console.log(`[Shapes] Content: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);
      
      const headers = {
        "X-User-Id": userId
      };
      
      if (channelId) {
        headers["X-Channel-Id"] = channelId;
      }

      const response = await shapes.chat.completions.create({
        model: `shapesinc/${SHAPES_USERNAME}`,
        messages: [{ role: "user", content }],
        extra_headers: headers
      });

      const responseText = response.choices[0].message.content;
      console.log(`[Shapes] Response received (${responseText.length} chars)`);

      return responseText?.trim() || "Sorry, the AI did not return a response.";
    } catch (error) {
      retries++;
      console.error(`[Shapes] Error (attempt ${retries}/${MAX_RETRIES + 1}): ${error.message}`);
      
      if (retries <= MAX_RETRIES) {
        console.log(`[Shapes] Retrying in ${RETRY_DELAY/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else {
        return `Sorry, I encountered an error while processing your request with the AI after multiple attempts: ${error.message}`;
      }
    }
  }
}

// Initialize Reddit client
const redditConfig = {
  userAgent: `${process.env.SHAPESINC_SHAPE_USERNAME || 'ShapesRedditBot'}/1.0.0`,
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASSWORD
};

const client = new Snoowrap(redditConfig);
const BOT_START = Date.now() / 1000;

/**
 * Check if the message contains a summon of the bot
 * @param {string} msg - Message to check
 * @returns {boolean} - Whether the message contains a summon
 */
const canSummon = (msg) => {
  if (typeof msg !== 'string') return false;
  const lowerMsg = msg.toLowerCase();
  const lowerUsername = redditConfig.username.toLowerCase();
  return lowerMsg.includes(`u/${lowerUsername}`) || lowerMsg.includes(`/u/${lowerUsername}`);
};

function startCommentStream() {
  console.log(`[Reddit] Starting comment stream for r/${SUBREDDIT}`);
  console.log(`[Reddit] Listening for mentions of u/${redditConfig.username}`);
  console.log(`[Reddit] Poll time: ${POLL_TIME}ms, Limit: ${LIMIT} items`);

  const comments = new CommentStream(client, {
    subreddit: SUBREDDIT,
    limit: LIMIT,
    pollTime: POLL_TIME
  });

  comments.on('item', async (item) => {
    // Skip old comments and self-comments
    if (item.created_utc < BOT_START) return;
    if (item.author.name.toLowerCase() === redditConfig.username.toLowerCase()) return;
    
    if (!canSummon(item.body)) return;

    console.log(`[Reddit] Summon detected in comment ID: ${item.id}`);
    console.log(`[Reddit] Author: ${item.author.name}, Subreddit: r/${item.subreddit.display_name}`);
    console.log(`[Reddit] Comment preview: "${item.body.substring(0, 100)}${item.body.length > 100 ? '...' : ''}"`);

    try {
      // Process the comment with Shapes API
      const replyText = await processWithShapes(
        item.body, 
        item.author.name, 
        item.subreddit.display_name
      );
      
      console.log(`[Reddit] Replying to comment ID: ${item.id}`);
      await item.reply(replyText);
      console.log(`[Reddit] Reply sent successfully to comment ID: ${item.id}`);
    } catch (err) {
      console.error(`[Reddit] Error processing comment ID ${item.id}: ${err.message}`);
      
      try {
        await item.reply("Sorry, I encountered an error processing your request. Please try again later.");
        console.log(`[Reddit] Sent error message to comment ID: ${item.id}`);
      } catch (replyErr) {
        console.error(`[Reddit] Failed to send error reply to comment ID: ${item.id}: ${replyErr.message}`);
      }
    }
  });

  comments.on('error', (err) => {
    console.error(`[Reddit] Comment stream error: ${err.message}`);
    console.log('[Reddit] Restarting comment stream in 30 seconds...');
    
    setTimeout(() => {
      startCommentStream();
    }, 30000);
  });

  return comments;
}
process.on('SIGINT', () => {
  console.log('[System] Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('[System] Uncaught exception:', err);
  console.log('[System] Restarting in 60 seconds...');
  
  setTimeout(() => {
    startCommentStream();
  }, 60000);
});

startCommentStream();
console.log('[System] Reddit bot started successfully.');
