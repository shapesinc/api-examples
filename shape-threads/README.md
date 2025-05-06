# Shape Threads Bot

This is a bot that connects your [Shapes.inc](https://shapes.inc) shape to [Threads](https://threads.net), Meta's text-based conversation app. The bot will respond to mentions and replies on Threads using your shape's personality.

## Shape Capabilities on Threads

Your shape on Threads can:

1. **Respond to Mentions** - When someone mentions your shape (@yourhandle), your shape will automatically respond with its unique personality.

2. **Reply to Comments** - Your shape will respond to comments on its posts, creating natural conversation threads.

3. **Maintain Context** - The shape remembers conversations with specific users in specific threads (using the X-User-Id and X-Channel-Id headers).

4. **Process Text Content** - Your shape can understand and respond to text content in posts, using its AI capabilities.

5. **Personalized Responses** - Responses will reflect your shape's personality as configured in Shapes.inc.

## Features

- Monitors Threads for mentions and replies to your bot
- Processes messages using the Shapes API
- Maintains separate conversations per user and thread
- Automatically replies to mentions and comments

## Prerequisites

Before running the bot, you need:

1. A Threads/Instagram account for your bot
2. Instagram Graph API access and permissions
3. A Shapes.inc account with a shape
4. Node.js v16 or higher

## Setup

1. Clone this repository:
```bash
git clone https://github.com/shapesinc/api-examples.git
cd api-examples/shape-threads
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on the `.env.example`:
```bash
cp .env.example .env
```

4. Fill in the `.env` file:
- `INSTAGRAM_ACCESS_TOKEN`: Your Instagram Graph API access token with permissions for Threads
- `INSTAGRAM_USER_ID`: Your Instagram/Threads user ID
- `SHAPESINC_API_KEY`: Your Shapes API key
- `SHAPESINC_SHAPE_USERNAME`: Your shape's username 
- `POLLING_INTERVAL`: (Optional) How often to check for new mentions in milliseconds (default: 60000)

## Running the Bot

```bash
npm start
```

The bot will:
1. Log in to Instagram Graph API
2. Start monitoring for mentions and replies on Threads
3. Respond to new mentions and replies using your shape

## How It Works

1. The bot polls the Instagram Graph API periodically to check for new mentions on Threads
2. When someone mentions your bot or replies to one of its posts, the bot extracts the message content
3. The content is sent to the Shapes API, which processes it through your shape
4. The response is posted back to Threads as a reply to the original post or comment

## Notes on Instagram Graph API and Threads

This integration uses the Instagram Graph API to interact with Threads. As of the creation of this integration, Meta's API support for Threads is still evolving. You may need to:

1. Apply for API access through the Meta Developer Portal
2. Request specific permissions for your app
3. Comply with Meta's Platform Terms and Developer Policies

## Troubleshooting

If you encounter issues:

- Check that your Instagram Graph API credentials are correct and have the necessary permissions
- Verify your Shapes API key and shape username
- Ensure your shape is active and responding in the Shapes platform
- Check the console logs for detailed error messages

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Feel free to submit issues or pull requests if you have suggestions for improvements! 