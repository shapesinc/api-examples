# Shape WhatsApp Bot

A WhatsApp bot powered by the Shapes API that provides AI-powered conversational interactions directly through WhatsApp.

## Features

- Direct messaging with Shape AI Character
- Supports both direct and group chat interactions

## Prerequisites

- Node.js (v14 or later)
- WhatsApp account
- Shapes Inc. API Key
- Ngrok account (for exposing local server)

### Installing Ngrok

1. Sign up for a free account at [ngrok.com](https://ngrok.com/)

2. Install Ngrok globally via npm:
   ```bash
   npm install -g ngrok
   ```

3. Authenticate Ngrok with your account:
   ```bash
   ngrok authtoken YOUR_NGROK_AUTHTOKEN
   ```
   (You can find your authtoken in the Ngrok dashboard)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/shape-whatsapp-bot.git
   cd shape-whatsapp-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root and add the following environment variables:
   ```
   SHAPESINC_API_KEY=your_shapes_api_key
   SHAPESINC_SHAPE_USERNAME=your_shape_username
   ```

## Running the Bot

1. Start the application:
   ```bash
   npm start
   ```

2. Open the generated Ngrok URL in your browser to scan the QR code with WhatsApp.

## Usage Commands
- `!ping`: Triggers the bot
- Automatically process replies on DM

## Environment Configuration

- `SHAPESINC_API_KEY`: Your Shapes Inc. API key
- `SHAPESINC_SHAPE_USERNAME`: Your shape's username

## Notes

- The bot uses WhatsApp Web JS for WhatsApp integration
- Requires internet connection
- First-time setup may require scanning QR code

## Troubleshooting

- Ensure API keys are correctly set
- Check network connectivity
- Verify WhatsApp Web compatibility

## License

© 2025 Shapes Inc. All rights reserved.

## Disclaimer

This is an example application and should be used responsibly and in compliance with WhatsApp's terms of service.
