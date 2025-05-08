# Build AI Friends and Coworkers in Slack

This guide explains how to create an AI friend for your Slack workspace using shapes.inc.

## Overview

We will create a Slack app that can read messages in a channel and reply to them in the UI.

Implementation approach:

1. Create a Slack app that can listen to messages in channels
2. Set up event subscriptions to capture messages
3. Process these messages through your API, which connects to the Shapes API
4. Use the Slack API to post responses back to the channel

## Setting Up Your Slack App

You'll need to create a Slack app with the right permissions to:

- Read messages in channels (without being mentioned)
- Post messages back to channels

### Step 1: Create a Slack App

1. Go to https://api.slack.com/apps and click "Create New App" > "From scratch"
2. Enter a name for your app and select your workspace
3. Once created, you'll need to set up permissions and event subscriptions
4. Add a profile picture for your app under "Display Information"

### Step 2: Get Your Tokens

#### SLACK_BOT_TOKEN

1. Go to the Slack API Dashboard and sign in with your Slack account
2. Select your Slack app from the list
3. In the left sidebar, click on "OAuth & Permissions"
4. Look in the "Bot User OAuth Token" section at the top of the page
5. The token will start with xoxb-

This token is what your app will use to authenticate with Slack's API.

#### SLACK_SIGNING_SECRET

1. In the "Basic Information" section of your Slack app settings
2. Under "App Credentials"
3. It's listed as "Signing Secret"

Keep these credentials secure and never commit them to public repositories.

### Step 3: Configure Bot Permissions

Under the "OAuth & Permissions" section, add these bot token scopes:

- channels:history - To read messages in channels
- chat:write - To send messages as your bot
- app_mentions:read - To read messages in channels without being mentioned
- canvases:read - To read messages in channels without being mentioned
- emoji:read - To read messages in channels without being mentioned
- links:write - To read messages in channels without being mentioned
- links:read - To read messages in channels without being mentioned

### Step 4: Set Up Event Subscriptions

This is the critical part for detecting messages without being mentioned:

1. Go to "Event Subscriptions" in your app's settings and enable events
2. Add the Request URL where your server will receive events (e.g., https://your-api.example.com/slack/events)
3. Under "Subscribe to bot events," add the `message.channels` event type
   - message.channels - This lets your bot receive all messages from public channels it's in without requiring mentions
   - message.im - This lets your bot receive all messages from direct messages it's in without requiring mentions
   - app_mention - Subscribe to only the message events that mention your app or bot

### Step 5: Install App to Workspace

After configuring permissions, install your app to your workspace. You'll receive a Bot User OAuth Token that you'll need for your application.

## Creating Your Backend API

Create a server to process messages and send replies. You can use the main.py file as a starting point.

All you need to do is create a simple server that will pick up Slack events. Use the shapes client to process the message and then send the response back to Slack using the Slack bolt framework.

### How it works:

1. User sends a message in a Slack channel where your bot is a member
2. Slack sends this event to your server at /slack/events
3. Your app receives this event
4. It processes the message using the integrated Shapes API client
5. It sends the response back to the Slack channel

### Running Locally:

```
pip install -r requirements.txt
python main.py
```

## Shapes API Configuration

To get your shapes environment variables:

### SHAPESINC_SHAPE_USERNAME

It's your shape vanity username. You can find it when you go to your shape profile page on shapes.inc. Get the part after /shapes.inc/ in the URL.

### SHAPESINC_API_KEY

It's your shapes API key. You can find it when you go to your shape profile page on shapes.inc.

## Shapes Header Parameters

The shapes client is a Python client used to send messages to the shapes API. We have two header params that we need to pass in the request so your Shape can know who is speaking to it and where the conversation is happening.

```
X-User-Id: user_id
```

This is the user ID of the user who sent the message. This allows the shape to know who is speaking to it.

```
X-Channel-Id: channel_id
```

This is the channel ID of the channel where the message was sent. This allows the shape to know where to send the response.

## Using Docker

```
docker build -t shape-slack .
docker run -p 3000:3000 shape-slack
docker run -d -p 3000:3000 --name my-container shape-slack
docker exec -it my-container /bin/bash
```

## Unleashing Your Shape

### Step 1: Invite Your Bot to a Channel

- In your Slack workspace, create a test channel or use an existing one
- Invite your bot by typing `/invite @your-bot-name` in the channel

### Step 2: Send a Test Message

- Send a simple message in the channel where your bot was invited
- Your message should be picked up by your bot even without mentioning it directly

### Step 3: Check the Logs

You can view the logs by going to URL and adding /logs to the end of the URL. You will be prompted to enter a secret. The secret is stored in the environment variable LOGS_SECRET.
