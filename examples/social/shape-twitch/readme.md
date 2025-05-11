# Twitch Bot with Shapes API Integration

This project creates a Twitch chat bot that responds to user commands by using the Shapes API to generate responses.

## Features

- Connects to Twitch chat via WebSocket
- Responds to `!ask` and `!shape` commands
- Processes user prompts using your custom Shapes API model/Shape Username
- Sends responses back to the Twitch chat

## Prerequisites

- Node.js (v16 or newer)
- npm or yarn
- A Twitch account
- A Shapes Inc account with an API key
## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/shapesinc/api-examples.git
cd shape-twitch
```

### 2. Install dependencies

```bash
npm install 
```

### 3. Configure environment variables

Create a `.env` file in the root directory with the following variables:

```
SHAPESINC_API_KEY=your_shapes_api_key
SHAPESINC_SHAPE_USERNAME=your_shapes_username
TWITCH_OAUTH=your_twitch_oauth_token
TWITCH_CHANNEL=your_twitch_channel_name
```

### 4. Obtain Twitch OAuth Token

To get your Twitch OAuth token:

1. Visit https://antiscuff.com/oauth/
2. Sign in with your Twitch account
3. Authorize the application
4. Copy the OAuth token (it should start with "oauth:")
   - Note: Remove the prefix OAuth: 

### 5. Running the bot

```bash
npm run start
```

## Usage

Once the bot is running and connected to your Twitch channel, users can interact with it using these commands:

- `!ask [question]` - The bot will process the question and respond in the chat
- `!shape [prompt]` - Alternative command that does the same thing



## Troubleshooting

### Common Issues

1. **Connection failures**: Make sure your OAuth token is valid and hasn't expired
2. **API errors**: Verify your Shapes API key and username are correct
3. **No responses**: Ensure your bot has joined the correct Twitch channel

### Debugging

The application logs all incoming messages from Twitch and any errors encountered. Check these logs to identify issues.


## How It Works

1. The bot checks/listen for commands with !shape and !ask and automatically process the message to Shape
2. The content is sent to the Shapes API, which processes it through your shape
3. The response is posted back to Twitch Chat as a reply

## License

This project is licensed under the MIT License - see [LICENSE](https://github.com/shapesinc/api/blob/main/license) for details.


## Contribution
Contributing Feel free to submit issues or pull requests to improve the bot. Ensure any changes are tested and maintain compatibility with the Twitch Application and Shapes API.