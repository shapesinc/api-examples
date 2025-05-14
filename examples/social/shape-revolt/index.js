const OpenAI = require('openai');
const WebSocket = require('ws');
const EventEmitter = require('events');
const dotenv = require('dotenv');
const https = require('https');

// Load environment variables
dotenv.config({ path: '/home/container/bot2/.env' }); //change to your device/host path

// Validate environment variables
if (!process.env.SHAPESINC_API_KEY) {
  throw new Error('SHAPESINC_API_KEY is not defined in .env file');
}
if (!process.env.REVOLT_TOKEN) {
  throw new Error('REVOLT_TOKEN is not defined in .env file');
}
if (!process.env.SHAPESINC_SHAPE_USERNAME) {
  throw new Error('SHAPESINC_SHAPE_USERNAME is not defined in .env file');
}

// Configuration
const token = process.env.REVOLT_TOKEN;
const apiKey = process.env.SHAPESINC_API_KEY;
const SHAPES_USERNAME = process.env.SHAPESINC_SHAPE_USERNAME;
const REVOLT_API_URL = 'https://api.revolt.chat';
const REVOLT_SERVER_URL = process.env.REVOLT_SERVER_URL || 'https://autumn.revolt.chat';

// Set up the Shapes API client
const shapes = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://api.shapes.inc/v1',
});

// Bot information
let botId = null;
let botUsername = null;

// Create event emitter for custom events
const events = new EventEmitter();

// Initialize HTTP client for Revolt API
const revoltAPI = {
  get(endpoint) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.revolt.chat',
        path: endpoint,
        method: 'GET',
        headers: {
          'x-bot-token': token
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ data: JSON.parse(data) });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  },

  post(endpoint, body) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const options = {
        hostname: 'api.revolt.chat',
        path: endpoint,
        method: 'POST',
        headers: {
          'x-bot-token': token,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      };
  
      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve({ data: JSON.parse(responseData) });
            } catch (error) {
              reject(new Error(`Failed to parse response: ${responseData}`));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
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

// Helper function to send a message to a channel
async function sendMessage(channelId, content) {
  try {
    const MAX_LENGTH = 1900; // Revolt's message length limit with buffer
    if (content.length <= MAX_LENGTH) {
      // Send short messages directly
      const response = await revoltAPI.post(`/channels/${channelId}/messages`, {
        content: content
      });
      console.log('Message sent successfully');
      return response.data;
    } else {
      // Split long messages into chunks
      const chunks = [];
      let currentChunk = '';
      const paragraphs = content.split('\n\n'); // Split by paragraphs

      for (const paragraph of paragraphs) {
        if (currentChunk.length + paragraph.length + 2 <= MAX_LENGTH) {
          // Add paragraph to current chunk
          currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        } else {
          // Save current chunk and start a new one
          if (currentChunk) chunks.push(currentChunk);
          currentChunk = paragraph;
          // Handle oversized paragraphs
          while (currentChunk.length > MAX_LENGTH) {
            let splitPoint = currentChunk.lastIndexOf(' ', MAX_LENGTH);
            if (splitPoint === -1) splitPoint = MAX_LENGTH;
            chunks.push(currentChunk.slice(0, splitPoint));
            currentChunk = currentChunk.slice(splitPoint).trim();
          }
        }
      }
      // Add the final chunk
      if (currentChunk) chunks.push(currentChunk);

      // Send each chunk as a separate message
      for (const chunk of chunks) {
        const response = await revoltAPI.post(`/channels/${channelId}/messages`, {
          content: chunk
        });
        console.log('Chunk sent successfully:', chunk.slice(0, 50) + '...');
      }
      console.log('All chunks sent successfully');
      return { message: 'All chunks sent' };
    }
  } catch (error) {
    console.error('Error sending message:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
  }
}

/**
 * Process attachments from a message to extract image or audio URLs
 * @param {Array} attachments - Array of attachment objects from Revolt
 * @returns {Object|null} - Object with image and/or audio URLs, or null if none found
 */
function processAttachments(attachments) {
  if (!attachments || attachments.length === 0) return null;
  
  const result = {};
  
  for (const attachment of attachments) {
    // Log attachment information for debugging
    console.log('Processing attachment:', JSON.stringify(attachment, null, 2));
    
    // Get the URL from the attachment
    let url = '';
    
    // Handle different attachment structures from Revolt
    if (attachment.url) {
      url = attachment.url;
    } else if (attachment._id || attachment.id) {
      // Construct URL based on ID
      const attachmentId = attachment._id || attachment.id;
      url = `${REVOLT_SERVER_URL}/attachments/${attachmentId}`;
    } else if (typeof attachment === 'string' && attachment.includes('/')) {
      // Handle if attachment is directly a URL string
      url = attachment;
    }
    
    // Ensure URL is properly encoded if needed
    if (url && !url.startsWith('http')) {
      url = `https://${url}`;
    }
    
    console.log('Resolved attachment URL:', url);
    
    if (!url) continue;
    
    // Check attachment type
    const contentType = attachment.content_type || '';
    if (contentType.startsWith('image/') || 
        url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
      result.image = url;
      console.log('Found image attachment:', url);
    } else if (contentType.startsWith('audio/') || 
              contentType === 'audio/mpeg' || 
              contentType === 'audio/mp3' ||
              contentType === 'audio/ogg' ||
              url.match(/\.(mp3|wav|ogg|m4a)$/i)) {
      result.audio = url;
      console.log('Found audio attachment:', url);
    }
  }
  
  // If no valid attachments found, return null
  if (!result.image && !result.audio) {
    return null;
  }
  
  console.log('Final attachments object:', JSON.stringify(result));
  return result;
}

// Main bot function
async function startBot() {
  try {
    // Get bot info first
    const { data: self } = await revoltAPI.get('/users/@me');
    
    botId = self._id;
    botUsername = self.username;
    console.log(`Logged in as ${botUsername} (${botId})`);
    
    // Connect using the WebSocket URL for bots
    const socket = new WebSocket('wss://ws.revolt.chat');
    
    socket.on('open', () => {
      console.log('Connected to Revolt WebSocket');
      // Authenticate with bot token
      socket.send(JSON.stringify({
        type: 'Authenticate',
        token: token
      }));
    });
    
    socket.on('message', async (data) => {
      try {
        const message = JSON.parse(data);
        console.log('Received message:', message.type);
        
        if (message.type === 'Ready') {
          console.log('Bot is ready to receive messages');
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
          
          // Check if bot is mentioned or if it's a DM
          const isMentioned = message.content && message.content.includes(`<@${botId}>`);
          const hasAttachments = message.attachments && message.attachments.length > 0;
          
          if (isMentioned || isDM) {
            console.log(isDM ? 'Message is in DM' : 'Bot was mentioned!');
            try {
              // Remove the mention from the message if present
              let content = message.content || '';
              if (isMentioned) {
                content = content.replace(new RegExp(`<@${botId}>`, 'g'), '').trim();
              }
              
              // Process any attachments
              const attachments = hasAttachments ? processAttachments(message.attachments) : null;
              
              // Handle empty messages differently if there are attachments
              if (!content && !attachments) {
                await sendMessage(message.channel, "Hello! How can I help you today?");
                return;
              }
              
              // If we have no text but have attachments, use a generic prompt
              if (!content && attachments) {
                content = "Please describe this";
              }
              
              console.log('Sending to Shapes API...');
              
              // Prepare API request based on content type
              let apiMessages;
              
              if (attachments) {
                // Create multimodal content array
                const contentArray = [{ type: "text", text: content || "Please describe this" }];
                
                if (attachments.image) {
                  console.log('Adding image to API request');
                  contentArray.push({
                    type: "image_url",
                    image_url: { url: attachments.image }
                  });
                }
                
                if (attachments.audio) {
                  console.log('Adding audio to API request');
                  contentArray.push({
                    type: "audio_url",
                    audio_url: { url: attachments.audio }
                  });
                }
                
                apiMessages = [{ role: "user", content: contentArray }];
              } else {
                // Text-only request
                apiMessages = [{ role: "user", content: content }];
              }
              
              // Call the Shapes API using the OpenAI SDK
              const response = await shapes.chat.completions.create({
                model: `shapesinc/${SHAPES_USERNAME}`,
                messages: apiMessages,
                temperature: 0.7,
                max_tokens: 1000
              });
              
              // Extract response
              const aiResponse = response.choices[0].message.content;
              console.log('AI Response:', aiResponse);
              
              // Send the response back to the user
              await sendMessage(message.channel, aiResponse);
              
            } catch (error) {
              console.error('Error processing message:', error.message);
              if (error.response) {
                console.error('API Response:', error.response.data);
              }
              await sendMessage(message.channel, "Sorry, I encountered an error while processing your request.");
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

// Start the bot
console.log('Starting bot...');
startBot();
