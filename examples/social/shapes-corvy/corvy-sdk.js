/**
 * CorvyBot SDK - v1.0.0
 * Client library for building Corvy bots
 */

const axios = require('axios');

class CorvyBot {
  /**
   * Create a new bot instance
   * @param {Object} config - Bot configuration
   * @param {string} config.apiToken - Your bot's API token
   * @param {string} config.apiBaseUrl - Corvy API base URL
   * @param {Array<Object>} config.commands - Command definitions
   */
  constructor(config) {
    this.config = config;
    this.currentCursor = 0;
    
    // Create API client with authentication
    this.api = axios.create({
      baseURL: this.config.apiBaseUrl,
      headers: {
        'Authorization': `Bearer ${this.config.apiToken}`,
        'Content-Type': 'application/json'
      }
    });
  }
  
  /**
   * Start the bot
   * @returns {Promise<void>}
   */
  async start() {
    try {
      console.log('Starting bot...');
      
      // Authenticate first
      const response = await this.api.post('/auth');
      console.log(`Bot authenticated: ${response.data.bot.name}`);
      
      // Establish baseline (gets highest message ID but no messages)
      console.log('Establishing baseline with server...');
      const baselineResponse = await this.api.get('/messages', {
        params: { cursor: 0 }
      });
      
      // Save the cursor for future requests
      this.currentCursor = baselineResponse.data.cursor;
      console.log(`Baseline established. Starting with message ID: ${this.currentCursor}`);
      
      // Start processing new messages
      console.log(`Listening for commands: ${this.config.commands.map(c => c.prefix).join(', ')}`);
      this.processMessageLoop();
      
      // Set up graceful shutdown
      process.on('SIGINT', () => {
        console.log('Bot shutting down...');
        setTimeout(() => process.exit(0), 1000);
      });
    } catch (error) {
      console.error('Failed to start bot:', error.message);
      if (error.response) {
        console.error('Response:', error.response.data);
      }
      process.exit(1);
    }
  }
  
  /**
   * Process messages in a loop
   * @private
   */
  async processMessageLoop() {
    try {
      // Get new messages
      const response = await this.api.get('/messages', {
        params: { cursor: this.currentCursor }
      });
      
      // Update cursor
      this.currentCursor = response.data.cursor;
      
      // Process each new message
      for (const message of response.data.messages) {
        // Skip bot messages
        if (message.user.is_bot) continue;
        
        console.log(`Message from ${message.user.username} in ${message.flock_name}/${message.nest_name}: ${message.content}`);
        
        // Check for commands
        this.handleCommand(message);
      }
    } catch (error) {
      console.error('Error fetching messages:', error.message);
    } finally {
      // Always schedule the next check, even after errors
      setTimeout(() => this.processMessageLoop(), 1000);
    }
  }
  
  /**
   * Handle command messages
   * @param {Object} message - Message object
   * @private
   */
  handleCommand(message) {
    // Check each command prefix
    for (const command of this.config.commands) {
      if (message.content.toLowerCase().includes(command.prefix.toLowerCase())) {
        console.log(`Command detected: ${command.prefix}`);
        
        // Generate response using the command handler
        const responseContent = command.handler(message);
        
        // Send the response
        this.sendResponse(message.flock_id, message.nest_id, responseContent);
        
        // Stop after first matching command
        break;
      }
    }
  }
  
  /**
   * Send a response message
   * @param {string|number} flockId - Flock ID
   * @param {string|number} nestId - Nest ID
   * @param {string} content - Message content
   * @private
   */
  async sendResponse(flockId, nestId, content) {
    try {
      console.log(`Sending response: "${content}"`);
      
      await this.api.post(`/flocks/${flockId}/nests/${nestId}/messages`, { content });
    } catch (error) {
      console.error('Failed to send response:', error.response?.data || error.message);
    }
  }
}

module.exports = CorvyBot; 
