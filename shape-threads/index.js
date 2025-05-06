import { OpenAI } from 'openai';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID;
const SHAPES_API_KEY = process.env.SHAPESINC_API_KEY;
const SHAPES_USERNAME = process.env.SHAPESINC_SHAPE_USERNAME;
const POLLING_INTERVAL = parseInt(process.env.POLLING_INTERVAL || '60000', 10); // Default: 1 minute

// Initialize the Shapes API client
const shapes = new OpenAI({
  apiKey: SHAPES_API_KEY,
  baseURL: 'https://api.shapes.inc/v1',
});

// Store the last check timestamp to avoid processing the same mentions
let lastCheckTime = new Date().toISOString();

// Function to process a message with the Shapes API
async function processWithShapes(content, userId, threadId) {
  try {
    console.log('Sending to Shapes API:', content);
    
    // Create headers object - only include X-Channel-Id if threadId exists
    const headers = {
      "X-User-Id": userId
    };
    
    // Only add X-Channel-Id if threadId is provided
    if (threadId) {
      headers["X-Channel-Id"] = threadId;
    }
    
    // Call the Shapes API using the OpenAI SDK
    const response = await shapes.chat.completions.create({
      model: `shapesinc/${SHAPES_USERNAME}`,
      messages: [
        { role: "user", content: content }
      ],
      extra_headers: headers
    });
    
    // Extract response
    const aiResponse = response.choices[0].message.content;
    console.log('AI Response:', aiResponse);
    
    return aiResponse;
  } catch (error) {
    console.error('Error processing with Shapes API:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    return `Sorry, I encountered an error while processing your request.`;
  }
}

// Function to get mentions from Threads 
async function getMentions() {
  try {
    // Using Instagram Graph API to check mentions
    // Note: This is a placeholder implementation as Instagram's API for Threads is still evolving
    const fields = 'id,username,caption,timestamp,comments';
    const url = `https://graph.instagram.com/v12.0/${INSTAGRAM_USER_ID}/mentions?fields=${fields}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Instagram API returned: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching mentions:', error.message);
    return [];
  }
}

// Function to get comments on a post
async function getComments(postId) {
  try {
    const fields = 'id,username,text,timestamp';
    const url = `https://graph.instagram.com/v12.0/${postId}/comments?fields=${fields}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Instagram API returned: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error(`Error fetching comments for post ${postId}:`, error.message);
    return [];
  }
}

// Function to reply to a comment
async function replyToComment(commentId, message) {
  try {
    const url = `https://graph.instagram.com/v12.0/${commentId}/replies`;
    const params = new URLSearchParams();
    params.append('message', message);
    params.append('access_token', INSTAGRAM_ACCESS_TOKEN);
    
    const response = await fetch(url, {
      method: 'POST',
      body: params
    });
    
    if (!response.ok) {
      throw new Error(`Instagram API returned: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Reply posted successfully:', data.id);
    return data.id;
  } catch (error) {
    console.error('Error posting reply:', error.message);
    return null;
  }
}

// Function to check for new mentions and replies
async function checkForInteractions() {
  try {
    console.log('Checking for new mentions and replies...');
    
    // Get mentions
    const mentions = await getMentions();
    console.log(`Found ${mentions.length} mentions.`);
    
    // Filter for new mentions
    const newMentions = mentions.filter(mention => 
      new Date(mention.timestamp) > new Date(lastCheckTime)
    );
    
    // Update the last check time
    if (mentions.length > 0) {
      lastCheckTime = new Date().toISOString();
    }
    
    // Process each new mention
    for (const mention of newMentions) {
      console.log(`Processing mention: ${mention.id}`);
      
      try {
        // Get the content of the mention
        const content = mention.caption || '';
        
        // Process the mention with Shapes API
        const userId = `threads-user-${mention.username}`;
        const threadId = `threads-post-${mention.id}`;
        
        const aiResponse = await processWithShapes(content, userId, threadId);
        
        // Reply to the mention
        await replyToComment(mention.id, aiResponse);
      } catch (error) {
        console.error(`Error processing mention ${mention.id}:`, error.message);
      }
    }
    
    // Get comments on recent posts
    // This part would need to be implemented based on the actual Threads API capabilities
    // This is a placeholder for the actual implementation
    
  } catch (error) {
    console.error('Error checking for interactions:', error.message);
  }
}

// Main function to start the bot
async function startBot() {
  try {
    console.log('Starting Shape Threads bot...');
    
    // Verify Instagram credentials
    const response = await fetch(`https://graph.instagram.com/v12.0/me?access_token=${INSTAGRAM_ACCESS_TOKEN}`);
    
    if (!response.ok) {
      throw new Error(`Instagram API returned: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Logged in as ${data.username} (${data.id})`);
    console.log('Shape bot is running and monitoring for mentions on Threads...');
    
    // Check for interactions immediately
    await checkForInteractions();
    
    // Set up interval to check for new interactions
    setInterval(checkForInteractions, POLLING_INTERVAL);
    
  } catch (error) {
    console.error('Error starting bot:', error.message);
    console.log('Retrying in 10 seconds...');
    setTimeout(startBot, 10000);
  }
}

// Start the bot
startBot(); 