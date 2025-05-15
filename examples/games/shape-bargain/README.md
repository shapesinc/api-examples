# Shape Bargain

Shape Bargain is a Next.js-based merchant bargaining game built with the shapes-api. In this game, you negotiate with various merchants to buy and sell items, managing your inventory and gold to make the best deals possible.

## Features

- Multiple unique merchants with different personalities
- Bargaining and negotiation gameplay
- Inventory management system
- Gold-based economy
- Beautiful UI built with Tailwind CSS and Radix UI components

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

Next, create a `.env` file in the root directory with your Shapes API key:

```
SHAPESINC_API_KEY=your_shapes_api_key_here
```

This API key is required for the merchant chat functionality. You can get an API key from [Shapes Inc](https://shapes.inc/developer).

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to play the game.

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