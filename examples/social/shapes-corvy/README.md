[![Corvi](https://raw.githubusercontent.com/q8j-dev/corvy-shapes-assets/refs/heads/main/corvi.png)](https://corvy.chat)
[![Shapes](https://raw.githubusercontent.com/q8j-dev/corvy-shapes-assets/refs/heads/main/shapes.png)](https://shapes.inc)

# Shapes on Corvy [JS]!

A basic implementation of shapes.inc into corvy.chat.

-----------------------------------------------------

# Before you start

## 1. Inviting the bot.

Go to your bot settings, and then press "Add to Flock", with the correct flock selected, and then, you should be ready to start!

## 2. Extras

If you're trying to add the shape to another flock, ask an Admin or the Owner of that flock to add it for you, with your bot invite (which should release soon)

-----------------------------------------------------

# Set Up Guide

## 1. Prerequisites

Make sure you have the following installed:

Node.js (v16+ recommended)
`npm` or `yarn`

## 2. Project Setup

Create your project folder and files:

`mkdir shape-corvy
cd shape-corvy
touch config.env
npm init -y`

## 3. Install Dependencies

Install the required Node.js packages:

`npm install dotenv axios openai`

## 4. Configure config.env

Open `config.env` and add the string below (one per line):

`` SHAPESINC_API_KEY=your_shapes_api_key
SHAPESINC_SHAPE_USERNAME=your_shapes_model_name
CORVY_BOT_TOKEN=your_corvy_bot_token ``

Replace with your actual API keys and model name, which can be found at https://shapes.inc/developer (shapes api key), and https://corvy.chat/developers (corvy api key).

## 5. SDK and Bot

Download `bot.js` and `corvy-sdk` from this repository, and then drag into your bot folder (the same one where config.env is located).

## 6. Run the Bot

`node bot.js` inside of the folder with the files.

## 7. Confirm It’s Working

Go to your flock/nest where the bot is active and try commands like:

!ask How does gravity work?

!imagine A Corvus flying in the sky

The bot should reply with either text or image URLs.

## 8. Credits
 Credits go to [q8j.](https://github.com/q8j-dev)
