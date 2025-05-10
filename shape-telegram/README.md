# Build AI friends and coworkers in Telegram

How to create an AI friend for your Telegram using [shapes.studio](https://shapes.studio)

This project demonstrates how to create a Telegram bot that uses the Shapes API to generate natural responses to messages.

## Overview

Here's how this integration works:

1. Set up a Telegram bot using BotFather
2. Connect the bot to the Shapes API
3. Deploy the bot to a platform like Heroku or Replit
4. Chat with your Shapes AI through Telegram

## Creating Your Telegram Bot

### Step 1: Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Start a chat with BotFather and send the command `/newbot`
3. Follow the instructions to name your bot and create a username for it
4. BotFather will provide you with a token - this is your `TELEGRAM_BOT_TOKEN`
5. Customize your bot's profile picture and description using BotFather commands

### Step 2: Get Your Shapes API Key

1. Sign up or log in to [shapes.studio](https://shapes.studio)
2. Navigate to your API settings
3. Copy your API key - this is your `SHAPES_API_KEY`

## Setting Up the Project

### Prerequisites

- Python 3.11 or higher
- A Telegram bot token
- A Shapes API key

### Installation

1. Clone this repository
2. Run the setup script:

```bash
./setup.sh
```

This will:
- Create a virtual environment
- Install dependencies
- Create a .env file from the example

3. Edit the `.env` file to add your credentials:

```
TELEGRAM_BOT_TOKEN=your_bot_token_here
SHAPES_API_KEY=your_shapes_api_key_here
API_BASE_URL=https://api.shapes.studio/v1
```

## Running Locally

Run the bot with:

```bash
python index.py
```

## Bot Features

- Responds to direct messages
- In group chats, responds when:
  - Mentioned with @
  - Someone replies to its messages
  - Auto-reply mode is enabled with `/start`
  
### Commands

- `/start` - Enable auto-reply mode (bot responds to all messages)
- `/stop` - Disable auto-reply mode (bot only responds when mentioned)
- `/reset` - Clear conversation history

### Access Control (Optional)

The bot includes an optional access control system that restricts which chats can use it:

- By default, access control is disabled and anyone can use the bot
- To enable it, set `ACCESS_CHECK_ENABLED=true` in your environment variables
- You can also set `BOT_ADMIN_PASSWORD` to control who can approve chats

When access control is enabled, these additional commands become useful:
- `@botname getaccess` - Get your chat ID for approval
- `@botname giveaccess` - Approve a chat ID (requires admin password)

The approved chat IDs are stored in `approved_chats.json`.

## Deployment

### Deploying to Heroku

1. Install the Heroku CLI and log in:

```bash
heroku login
```

2. Create a new Heroku app:

```bash
heroku create your-app-name
```

3. Set the required environment variables:

```bash
heroku config:set TELEGRAM_BOT_TOKEN=your_bot_token --app your-app-name
heroku config:set SHAPES_API_KEY=your_shapes_api_key --app your-app-name
```

4. Deploy the application:

```bash
git push heroku main
```

### Deploying to Replit

1. Create a new Replit project
2. Upload the code or use the GitHub import
3. Add your secrets in the Replit secrets panel:
   - `TELEGRAM_BOT_TOKEN`
   - `SHAPES_API_KEY`
4. Start the bot by running `python index.py`

## How It Works

1. User sends a message to the bot in Telegram
2. The bot processes the message and maintains conversation context
3. The message is sent to the Shapes API
4. The Shapes API generates a response
5. The bot sends the response back to the user in Telegram

## Additional Information

The bot maintains separate conversation contexts for different chats, allowing you to have independent conversations in different channels or direct messages.

### Conversation Context

The bot tracks conversation history for each chat, providing context to the Shapes API so responses are relevant to the ongoing conversation.

## License

This project is licensed under the MIT License - see the LICENSE file for details.