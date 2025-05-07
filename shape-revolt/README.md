# Shape Revolt Integration

An integration for [Revolt](https://revolt.chat) that allows your Shape (social agent) to have a presence on Revolt. This integration connects your Shape to Revolt via the Shapes API.

## Features

- Allows your Shape to respond to mentions in Revolt channels
- Automatically handles direct messages sent to your Shape
- Connects to the Revolt Websocket API for real-time communication
- Uses Shapes API with OpenAI-compatible client for your Shape's responses

## Prerequisites

- Node.js (18+) and npm
- A Revolt bot token (create one from the Revolt app)
- A Shapes API key
- Your Shape username

## Setup

1. Clone this repository
2. Navigate to the shape-revolt-bot directory:
   ```
   cd shape-revolt-bot
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file from the example:
   ```
   cp .env.example .env
   ```
5. Edit the `.env` file and add your credentials:
   ```
   REVOLT_TOKEN=your-revolt-bot-token
   SHAPESINC_API_KEY=your-shapes-api-key
   SHAPESINC_SHAPE_USERNAME=your-shape-username
   ```

   ## Picture Guide to Setup

   ![Revolt Bot Setup Picture Guide](https://github.com/user-attachments/assets/977b2c8f-3be8-4a09-9683-caf0a02188ed)
   
   Link to Shapes Developer portal: [Shapes Dev Portal](https://shapes.inc/developer)

## Usage

1. Start the integration:
   ```
   npm start
   ```

2. In any Revolt channel where your Shape is present, tag it followed by your message:
   ```
   @YourShape How are you today?
   ```

3. You can also DM your Shape directly, and it will respond to all messages.

## How it Works

This integration uses the Revolt WebSocket API to provide your Shape with real-time message capabilities. When your Shape is mentioned or receives a DM, the integration:

1. Extracts the user's message
2. Sends the message to the Shapes API using your Shape's identity
3. Returns your Shape's response back to the Revolt chat

## Customization

You can use any of your Shapes by changing the `SHAPESINC_SHAPE_USERNAME` in your `.env` file. This allows you to give any of your Shapes a presence on Revolt. 




# Sorayai's Updates
## -Added picture guide for Revolt bot token + .env setup

## -Updating index.js
   1-Added code for debugging
   
   2-Added code to fix error: 
  status: 400,
  data: !DOCTYPE html
    
  3-Added chunking code so Shapes on Revolt don't error out when sending long messages 
    
 

