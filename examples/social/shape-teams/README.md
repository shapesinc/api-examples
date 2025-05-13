# Microsoft Teams Bot with Shapes API Integration

This project creates a Microsoft Teams bot that processes messages using the Shapes API to generate intelligent responses.

## Features

- Seamlessly integrates with Microsoft Teams by adding it to channels
- Processes user messages using your custom Shapes API model
- Easy deployment to Azure Bot Service

## Prerequisites

- Node.js (v16 or newer)
- npm or yarn
- Microsoft Azure account
- A Shapes Inc account with an API key
- ngrok for https proxy 
## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/teams-shapes-bot.git
cd teams-shapes-bot
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
BOT_ID=your_microsoft_app_id
BOT_PASSWORD=your_microsoft_app_password
BOT_TYPE=MultiTenant
BOT_TENANT_ID=your_tenant_id_if_single_tenant
```

### 4. Register your bot on Azure

1. Go to the [Azure Portal](https://portal.azure.com)
2. Create a new Bot Registration resource
3. Note the App ID and generate a new client secret
4. Gather the Tenant ID,from the azure directory & Bot type is usually specified under the configuration sections
5. Add these values to your `.env` file as BOT_ID and BOT_PASSWORD

### 5. Local testing with ngrok

To test your bot locally:

```bash
# Start your bot
 node index.js & ngrok http 3978
```

Once ngrok is running, copy the HTTPS URL (e.g., `https://your-ngrok-test.ngrok.io`) and update your bot's messaging endpoint in the Azure portal to `https://your-ngrok-url/api/messages`.

### 6. Deploying to Azure

For production deployment:

1. Create an Azure Web App
2. Configure the application settings with the same environment variables from your `.env` file
3. Deploy your code using Azure DevOps, GitHub Actions, or the Azure CLI
4. Or Simply go to Settings>Channel> Microsoft Teams

## Usage

Once the bot is added to a Microsoft Teams channel or chat, users can interact with it:

- Mention the bot followed by a question or prompt
- Use the `!ask [question]` command to ask a specific question
- Use the `!shape [prompt]` command as an alternative way to interact with the bot
- The bot will process the message through your Shapes model and respond

## How It Works

1. The bot receives messages from Microsoft Teams
2. It processes the message content through the Shapes API using your custom model
5. The response from Shapes is sent back to Teams

## Troubleshooting

### Common Issues

1. **Authentication errors**: Verify your BOT_ID and BOT_PASSWORD are correct
2. **API errors**: Check your Shapes API key and username
3. **Messaging endpoint errors**: Ensure your ngrok URL is correctly set in the Azure portal
4. **Bot not responding**: Check if the bot service is running and logs for any errors

### Debugging

The application logs important events and errors to the console. Check these logs to identify issues.

## Project Structure

- `index.js` - Main entry point, sets up the Express server and bot adapter
- `teamsBot.js` - Implements the bot logic and interaction with the Shapes API
- `config.js` - Configuration for the Bot Framework adapter
- `.env` - Environment variables (not included in repository)

## License

This project is licensed under the MIT License - see [LICENSE](https://github.com/shapesinc/api/blob/main/license) for details.

## Contribution

Feel free to submit issues or pull requests to improve the bot. Ensure any changes are tested and maintain compatibility with Microsoft Teams and the Shapes API.
