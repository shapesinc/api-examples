# Shape Guilded Bot

This is an example of a Guilded bot that integrates with the Shapes API, allowing your Shape to interact with users on Guilded.

## Prerequisites

- Node.js (v16 or higher recommended)
- A Guilded account and a bot token. You can create a bot application and get a token from your Guilded server settings.
- A Shapes API key and the username of your Shape.

## Setup

1.  **Clone or download this example:**
    If this example is part of a larger repository, navigate to the `shape-guilded` directory. Otherwise, download the files.

2.  **Install dependencies:**
    Open your terminal in the `shape-guilded` directory and run:
    ```bash
    npm install
    ```
- [note: do not run `npm audit fix` command after installing dependencies or it will give you errors (do `npm install guilded.js@latest` if it does.)]

3.  **Configure environment variables:**
    Create a `.env` file in the `shape-guilded` directory by copying the `.env.example` file:
    ```bash
    cp .env.example .env
    ```
    Edit the `.env` file and fill in your details:
    ```
    GUILDED_TOKEN="YOUR_GUILDED_BOT_TOKEN"
    SHAPES_API_KEY="YOUR_SHAPES_API_KEY"
    SHAPE_USERNAME="YOUR_SHAPE_USERNAME"
    ```
    - `GUILDED_TOKEN`: Your Guilded bot's token.
    - `SHAPES_API_KEY`: Your API key for Shapes.
    - `SHAPE_USERNAME`: The username of your Shape (e.g., `MyCoolShape`, not `shapesinc/MyCoolShape`).

## Running the Bot

Once configured, you can start the bot using:

```bash
npm start
```

The bot will log in to Guilded and announce its readiness in the console.

## How it Works

-   The bot listens for messages in Guilded channels.
-   **Activation**: To start interacting with the Shape in a specific channel, a user must type `/activate`. The bot will then forward messages from that channel to your configured Shape.
-   **Deactivation**: To stop forwarding messages, a user can type `/deactivate`.
-   **Reset Context**: Typing `/reset` will send a message to the user indicating the context has been reset. This is a signal for the user; the actual context management is handled by the Shapes API based on User ID and Channel ID.
-   When a message is received in an active channel (and it's not a command), the bot prepends the sender's Guilded username to the message and sends it to the Shapes API.
-   The Shape's response is then sent back to the Guilded channel.
-   The bot stores a list of active channels in `active_channels.json` to persist activations across restarts.

## Customization

-   **Command Prefix**: The default command prefix is `/`. You can change this in `index.js` by modifying the `commandPrefix` variable.
-   **Error Messages & Bot Responses**: Customize the bot's various messages (activation, deactivation, errors, etc.) by modifying the constant message functions at the top of `index.js`.

## File Structure

-   `index.js`: The main application file containing the bot's logic.
-   `package.json`: Defines project dependencies and scripts.
-   `.env.example`: Example environment variable configuration.
-   `README.md`: This file.
-   `active_channels.json`: (Generated at runtime) Stores the IDs of channels where the bot is active.
-   `.gitignore`: (Recommended) To exclude `node_modules` and `.env` from version control.

## Contributing

Feel free to adapt or extend this example for your own Shapes!
