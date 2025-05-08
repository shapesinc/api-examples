import { OpenAI } from 'openai';
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import dotenv from 'dotenv';
import https from 'https';

// Load environment variables
dotenv.config();

// Configuration
const REVOLT_TOKEN = process.env.REVOLT_TOKEN;
const SHAPES_API_KEY = process.env.SHAPESINC_API_KEY;
const SHAPES_USERNAME = process.env.SHAPESINC_SHAPE_USERNAME;
const REVOLT_API_URL = 'https://api.revolt.chat';

// Set up the Shapes API client
const shapes = new OpenAI({
  apiKey: SHAPES_API_KEY,
  baseURL: 'https://api.shapes.inc/v1',
});

// Bot information
let botId = null;
let botUsername = null;

// WebSocket connection
let socket = null;

// Create event emitter for custom events
const events = new EventEmitter();

// Initialize HTTP client for Revolt API
const revoltAPI = {
  async get(endpoint) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.revolt.chat',
        path: endpoint,
        method: 'GET',
        headers: {
          'x-bot-token': REVOLT_TOKEN
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            // Check for error status codes
            if (res.statusCode >= 400) {
              reject(new Error(`HTTP Error: ${res.statusCode} ${res.statusMessage}. Response: ${data}`));
              return;
            }
            
            if (data.trim().startsWith('error code:')) {
              reject(new Error(`HTTP Error: ${data.trim()}`));
              return;
            }
            
            const parsedData = JSON.parse(data);
            resolve({ data: parsedData });
          } catch (e) {
            console.error('Error parsing JSON response:', e.message);
            console.error('Raw response:', data);
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  },

  async post(endpoint, body) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const options = {
        hostname: 'api.revolt.chat',
        path: endpoint,
        method: 'POST',
        headers: {
          'x-bot-token': REVOLT_TOKEN,
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        res.on('end', () => {
          try {
            // Check for error status codes
            if (res.statusCode >= 400) {
              reject(new Error(`HTTP Error: ${res.statusCode} ${res.statusMessage}. Response: ${responseData}`));
              return;
            }
            
            if (responseData.trim().startsWith('error code:')) {
              reject(new Error(`HTTP Error: ${responseData.trim()}`));
              return;
            }
            
            const parsedData = JSON.parse(responseData);
            resolve({ data: parsedData });
          } catch (e) {
            console.error('Error parsing JSON response:', e.message);
            console.error('Raw response:', responseData);
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(data);
      req.end();
    });
  }
};

// Helper function to start typing indication
async function startTyping(channelId) {
  try {
    if (socket && socket.readyState === WebSocket.OPEN) {
      // Send BeginTyping websocket event
      socket.send(JSON.stringify({
        type: 'BeginTyping',
        channel: channelId
      }));
      console.log('Started typing indicator');
    } else {
      console.warn('Cannot start typing: socket not ready');
    }
  } catch (error) {
    console.error('Error starting typing indicator:', error.message);
  }
}

// Helper function to stop typing indication
async function stopTyping(channelId) {
  try {
    if (socket && socket.readyState === WebSocket.OPEN) {
      // Send EndTyping websocket event
      socket.send(JSON.stringify({
        type: 'EndTyping',
        channel: channelId
      }));
      console.log('Stopped typing indicator');
    } else {
      console.warn('Cannot stop typing: socket not ready');
    }
  } catch (error) {
    console.error('Error stopping typing indicator:', error.message);
  }
}

// Helper function to send a message to a channel
async function sendMessage(channelId, content, replyToId = null) {
  try {
    // Stop typing before sending message
    await stopTyping(channelId);
    
    // Prepare the message data
    const messageData = { content };
    
    // Add the reply information if we're replying to a message
    if (replyToId) {
      messageData.replies = [
        {
          id: replyToId,
          mention: false // Don't ping the user with the reply
        }
      ];
    }
    
    const response = await revoltAPI.post(`/channels/${channelId}/messages`, messageData);
    console.log('Message sent successfully');
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
  }
}

// Main bot function
async function startBot() {
  try {   
    // Get bot info first
    let self;
    try {
      const response = await revoltAPI.get('/users/@me');
      self = response.data;
    } catch (error) {
      console.error('Error getting bot info:', error.message);
      console.log('Retrying in 10 seconds...');
      setTimeout(startBot, 10000);
      return;
    }
    
    botId = self._id;
    botUsername = self.username;
    console.log(`Logged in as ${botUsername} (${botId})`);
    
    // Connect using the WebSocket URL for bots
    try {
      socket = new WebSocket('wss://ws.revolt.chat');
    } catch (error) {
      console.error('Error connecting to WebSocket:', error.message);
      console.log('Retrying in 5 seconds...');
      setTimeout(startBot, 5000);
      return;
    }
    
    socket.on('open', () => {
      console.log('Connected to Revolt WebSocket');
      try {
        // Authenticate with bot token
        socket.send(JSON.stringify({
          type: 'Authenticate',
          token: REVOLT_TOKEN
        }));
      } catch (error) {
        console.error('Error during authentication:', error.message);
        socket.close();
      }
    });
    
    socket.on('message', async (data) => {
      try {
        let message;
        try {
          message = JSON.parse(data);
        } catch (e) {
          console.error('Error parsing WebSocket message:', e.message);
          console.error('Raw WebSocket data:', data);
          return;
        }
        
        console.log('Received message:', message.type);
        
        if (message.type === 'Ready') {
          console.log('Bot is ready to receive messages');
        } else if (message.type === 'Error') {
          console.error('Revolt server error:', message.error);
          return;
        }
        
        if (message.type === 'Message') {
          // Ignore our own messages
          if (message.author === botId) return;
          
          console.log('Message received:', message.content);
          
          // Get channel details to check if it's a DM
          let isDM = false;
          try {
            const { data: channelData } = await revoltAPI.get(`/channels/${message.channel}`);
            isDM = channelData.channel_type === 'DirectMessage';
            console.log('Channel type:', channelData.channel_type, 'isDM:', isDM);
          } catch (err) {
            console.error('Error checking channel type:', err.message);
          }
          
          // Check if bot is mentioned, if it's a DM, or if it's a reply to the bot's message
          const isMentioned = message.content && message.content.includes(`<@${botId}>`);
          
          // Check if this is a reply to the bot
          let isReplyingToBot = false;
          let repliedToContent = '';
          
          // Check different possible reply formats based on the logs
          const replyIds = message.replyIds || 
                          (message.replies && Array.isArray(message.replies) ? message.replies : []) || 
                          (message.reply_to ? [message.reply_to] : []);
          
          if (replyIds && replyIds.length > 0) {
            try {
              // For each reply ID, check if it's a message from the bot
              for (const replyId of replyIds) {
                const { data: repliedToMessage } = await revoltAPI.get(`/channels/${message.channel}/messages/${replyId}`);
                console.log('Found replied to message:', repliedToMessage);
                if (repliedToMessage.author === botId) {
                  isReplyingToBot = true;
                  repliedToContent = repliedToMessage.content;
                  console.log('User is replying to bot message:', repliedToContent);
                  break;
                }
              }
            } catch (err) {
              console.error('Error checking reply message:', err.message);
            }
          }
          
          if (isMentioned || isDM || isReplyingToBot) {
            console.log(isDM ? 'Message is in DM' : isReplyingToBot ? 'Message is reply to bot' : 'Bot was mentioned!');
            try {
              // Start typing indicator
              await startTyping(message.channel);
              
              // Save the original message ID to reply to
              const originalMessageId = message._id;
              
              // Remove the mention from the message if present
              let content = message.content;
              if (isMentioned) {
                content = content.replace(new RegExp(`<@${botId}>`, 'g'), '').trim();
              }
              
              if (!content) {
                await sendMessage(message.channel, "Hello! How can I help you today?", message._id);
                return;
              }
              
              // Build message history for context
              const messages = isReplyingToBot 
                ? [
                    { role: "assistant", content: repliedToContent },
                    { role: "user", content: content }
                  ]
                : [
                    { role: "user", content: content }
                  ];
              
              // Call the Shapes API using the OpenAI SDK
              // Keep the typing indicator active while waiting for the API response
              const response = await shapes.chat.completions.create({
                model: `shapesinc/${SHAPES_USERNAME}`,
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000
              });
              
              // Extract response
              const aiResponse = response.choices[0].message.content;
              console.log('AI Response:', aiResponse);
              
              // Send the response back to the user as a reply to the original message
              await sendMessage(message.channel, aiResponse, originalMessageId);
              
            } catch (error) {
              await stopTyping(message.channel);
              
              console.error('Error processing message:', error.message);
              if (error.response) {
                console.error('API Response:', error.response.data);
              }
              await sendMessage(message.channel, "Sorry, I encountered an error while processing your request.", message._id);
            }
          }
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    });
    
    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
    
    socket.on('close', (code, reason) => {
      console.log(`WebSocket connection closed: ${code} - ${reason}`);
      console.log('Reconnecting in 5 seconds...');
      setTimeout(startBot, 5000);
    });
    
  } catch (error) {
    console.error('Error starting bot:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    console.log('Retrying in 10 seconds...');
    setTimeout(startBot, 10000);
  }
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  console.log('Bot will continue running despite the error');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  console.log('Bot will continue running despite the error');
});

// Start the bot
console.log('Starting bot...');
startBot(); 