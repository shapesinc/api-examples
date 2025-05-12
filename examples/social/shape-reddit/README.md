# Reddit Bot with Shapes API Integration

This project creates a Reddit bot that listens for mentions of its username in a specific subreddit and responds using the Shapes API.

## Features

- Connects to Reddit using Snoowrap
- Listens for mentions of the bot's username in a specified subreddit
- Processes user prompts using your custom Shapes API model/Shape Username
- Sends generated responses back to Reddit comments

## Prerequisites

- Node.js (v16 or newer)
- npm or yarn
- A Reddit account and Reddit API credentials (client ID, client secret, username, password)
- A Shapes Inc account with an API key

## Setup Instructions

### 1. Clone the repository

```bash
git clone git clone https://github.com/shapesinc/api-examples.git
cd shapes-reddit
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
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
REDDIT_SUBREDDIT=your_subreddit_name
```

### 4. Obtaining Reddit API credentials

To get your Reddit API credentials:

1. Go to Reddit's developer site 'https://www.reddit.com/prefs/apps/'
2. Create a new developer application (script type)
3. Copy the client ID, client secret, username, and password for your bot

### 5. Running the bot

```bash
npm run start
```

## Usage

Once the bot is running and connected to Reddit, it will automatically start listening for comments that mention its username in the specified subreddit. It will then respond to those comments by processing the content through the Shapes API.

## Bot Behavior

- The bot checks for mentions of `u/your_reddit_username` or `/u/your_reddit_username` in comments.
- The bot processes the comment content through the Shapes API, sending the author's name as X-User-Id and the subreddit name as X-Channel-Id.
- The response from the Shapes API is posted back to the comment as a reply.
- The bot ignores comments made by itself.


## Troubleshooting

### Common Issues

- **Reddit authentication failures**: Ensure your Reddit API credentials are correctly set up in the `.env` file.
- **Shapes API errors**: Verify your Shapes API key and username are correct and that the API is accessible.
- **No responses**: Check that the bot is properly connected to Reddit and is listening to the correct subreddit. Ensure the bot's username is correctly mentioned in comments.

### Debugging

The application logs all incoming comments, API interactions, and any errors encountered to the console. Check the console logs to identify issues.

## How It Works

1. **Initialization**: The bot loads environment variables, initializes the Snoowrap client for Reddit interaction, and sets up the OpenAI client pointing to the Shapes API.
2. **Comment Stream**: It starts a comment stream using snoostorm to monitor new comments in the specified subreddit.
3. **Mention Detection**: For each new comment, it checks if the bot's username is mentioned using canSummon. It also filters out comments made by the bot itself or made before the bot started.
4. **Shapes API Processing**: If a mention is detected, the comment body is sent to the processWithShapes function. This function calls the Shapes API with the comment content, user ID (comment author), and channel ID (subreddit name).
5. **Replying to Comment**: The response received from the Shapes API is then used to reply to the original comment on Reddit.
6. **Error Handling**: Basic error handling is included for both Shapes API calls and Reddit replies, logging errors and attempting to post a generic error message on Reddit if a reply fails.

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/shapesinc/api/blob/main/license) file for details.


## Contribution

Feel free to submit issues or pull requests to improve the bot. Ensure any changes are tested and maintain compatibility with Reddit's API and the Shapes API.