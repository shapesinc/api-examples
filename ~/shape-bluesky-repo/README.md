# Shape Bluesky Bot

This is a bot that connects your [Shapes.inc](https://shapes.inc) shape to [Bluesky](https://bsky.app), a social media platform built on the AT Protocol. The bot will respond to mentions and replies on Bluesky using your shape's personality.

## Shape Capabilities on Bluesky

Your shape on Bluesky can:

1. **Respond to Mentions** - When someone mentions your shape (using @yourhandle), your shape will automatically respond with its unique personality.

2. **Reply to Conversations** - Your shape will respond to any replies to its posts, creating natural conversation threads.

3. **Maintain Context** - The shape remembers conversations with specific users in specific threads (using the X-User-Id and X-Channel-Id headers).

4. **Process Text Content** - Your shape can understand and respond to text content in posts, using its AI capabilities.

5. **Personalized Responses** - Responses will reflect your shape's personality as configured in Shapes.inc.

## Features

- Monitors Bluesky for mentions and replies to your bot
- Processes messages using the Shapes API
- Maintains separate conversations per user and thread
- Automatically replies to mentions and direct replies

## Prerequisites

Before running the bot, you need:

1. A Bluesky account for your bot
2. A Shapes.inc account with a shape
3. Node.js v16 or higher

## Setup

1. Clone this repository:
```bash
git clone https://github.com/shapesinc/api-examples.git
cd api-examples/shape-bluesky
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
- `BLUESKY_IDENTIFIER`: Your Bluesky handle (e.g. `yourbotname.bsky.social`)
- `BLUESKY_PASSWORD`: Your Bluesky app password (create one in account settings)
- `SHAPESINC_API_KEY`: Your Shapes API key
- `SHAPESINC_SHAPE_USERNAME`: Your shape's username 
- `POLLING_INTERVAL`: (Optional) How often to check for new mentions in milliseconds (default: 60000)

## Running the Bot

```bash
npm start
```

The bot will:
1. Log in to Bluesky
2. Start monitoring for mentions and replies
3. Respond to new mentions and replies using your shape

## How It Works

1. The bot polls the Bluesky API periodically to check for new notifications
2. When someone mentions your bot or replies to one of its posts, the bot extracts the message content
3. The content is sent to the Shapes API, which processes it through your shape
4. The response is posted back to Bluesky as a reply to the original post

## Best Practices for Your Bluesky Shape

1. **Set a Clear Profile** - Give your shape a clear profile description on Bluesky so users understand it's an AI assistant.

2. **Engagement Strategy** - Consider how you want your shape to engage. Will it only respond when mentioned, or will it also post original content?

3. **Content Guidelines** - Make sure your shape's responses align with Bluesky's community guidelines and terms of service.

4. **Monitoring** - Keep an eye on your shape's interactions to ensure it's behaving as expected.

5. **Conversation Management** - The bot handles conversations on a per-thread basis, allowing your shape to have multiple conversations simultaneously.

## Customization Options

You can customize your Bluesky shape by:

1. **Configuring Your Shape** - Adjust your shape's personality and behavior in the Shapes.inc platform.

2. **Adjusting Polling Interval** - Change how frequently the bot checks for new mentions in the .env file.

3. **Modifying Code** - You can modify the code to add custom functionality like scheduled posts or content filtering.

## Troubleshooting

If you encounter issues:

- Check that your Bluesky credentials are correct
- Verify your Shapes API key and shape username
- Ensure your shape is active and responding in the Shapes platform
- Check the console logs for detailed error messages

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Feel free to submit issues or pull requests if you have suggestions for improvements! 