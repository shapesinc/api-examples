# Shape Revolt Integration

An integration for [Revolt](https://revolt.chat) that allows your Shape (social agent) to have a presence on Revolt. This integration connects your Shape to Revolt via the Shapes API.

## Features

- Allows your Shape to respond to mentions in Revolt channels
- Automatically handles direct messages sent to your Shape
- Connects to the Revolt Websocket API for real-time communication
- Uses Shapes API with OpenAI-compatible client for your Shape's responses
- Supports image and audio attachments for multimodal conversations
- Processes media files and sends them to Shapes API for analysis

## Prerequisites

- Node.js (18+) and npm
- A Revolt bot token (create one from the Revolt app)
- A Shapes API key
- Your Shape username

## Setup

1. Clone this repository
2. Navigate to the shape-revolt directory:
   ```
   cd shape-revolt
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
   REVOLT_SERVER_URL=https://autumn.revolt.chat  # Optional: Override default server URL for attachments
   ```
6. change the file path to match your device
```javascript
   dotenv.config({ path: '/home/container/bot2/.env' }); //change to your device/host path
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
   
   **Example of chat in server:**
   
   ![Example of chat in server](https://img.intercomm.in/wy1epy.png)

3. You can also DM your Shape directly, and it will respond to all messages.

   **Example of chat in DM:**
   
   ![Example of chat in DM](https://img.intercomm.in/fxb7t9.png)

4. Send images or audio files with your messages to enable multimodal conversations:
   ```
   @YourShape What do you think of this picture?
   [attach an image]
   ```

## How it Works

This integration uses the Revolt WebSocket API to provide your Shape with real-time message capabilities. When your Shape is mentioned or receives a DM, the integration:

1. Extracts the user's message
2. Processes any attached images or audio files
3. Formats the content appropriately for multimodal API requests
4. Sends the message and media to the Shapes API using your Shape's identity
5. Returns your Shape's response back to the Revolt chat

## Customization

You can use any of your Shapes by changing the `SHAPESINC_SHAPE_USERNAME` in your `.env` file. This allows you to give any of your Shapes a presence on Revolt. 