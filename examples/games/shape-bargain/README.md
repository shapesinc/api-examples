# Bargain with Shapes!

![image](https://github.com/user-attachments/assets/ac5fcc53-b785-4bd3-b5ce-df2de749d9f2)

'Merchant of Venice' is a Next.js-based merchant bargaining game built with the shapes-api. In this game, you negotiate with various merchants to buy and sell items, managing your inventory and gold to make the best deals possible.

You can play a live demo right here: [https://www.arguewithshapes.com/](https://www.arguewithshapes.com/)

If you wish to train your own shape, check out examples.md for fine-tune chats examples!

![image](https://github.com/user-attachments/assets/c73c9c59-e6e5-4b2b-9c8e-38f84823683f)

## Features

- Multiple unique merchants with different personalities
- Bargain, negotiate and make deals with shapes!
- Persistent inventory system (across the current session)
- Generative UI elements based on the conversation

![image](https://github.com/user-attachments/assets/15e76e95-5b22-4207-ac50-7b6de9a1a2d5)


## Getting Started

First, install the dependencies:

```bash
pnpm install
```

Next, create a `.env` file in the root directory with your Shapes API key:

```
SHAPESINC_API_KEY=your_shapes_api_key_here
```

This API key is required for the merchant chat functionality. You can get an API key from [Shapes Inc](https://shapes.inc/developer).

Then, run the development server:

```bash
pnpm dev
```

And open [http://localhost:3000](http://localhost:3000) with your browser to play the game.

## Game Overview

In Shape Bargain, you'll:
- Visit different merchants in a directory
- Chat with merchants to learn about their items
- Haggle over prices to get the best deals
- Manage your inventory by buying and selling items

## Technologies Used

- Next.js 15 with Turbopack
- React 19
- Tailwind CSS
- Framer Motion for animations
- Zustand for state management
- Shapes-api for agentic communication
