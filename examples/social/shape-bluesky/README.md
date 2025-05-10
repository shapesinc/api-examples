# Shape Bluesky Bot

This is a bot that connects your [Shapes.inc](https://shapes.inc) shape to [Bluesky](https://bsky.app), a social media platform built on the AT Protocol. The bot will respond to mentions and replies on Bluesky using your shape's personality.

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

## Tips

- To ensure your bot maintains a consistent personality, make sure your shape is well-configured
- Bluesky has rate limits, so the bot includes a default polling interval of 1 minute
- To have the bot respond to posts that do not explicitly mention it, you can modify the notification handling in the code

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