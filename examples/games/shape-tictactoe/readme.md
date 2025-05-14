
# Shape Tic-Tac-Toe

A modern Tic-Tac-Toe game built with Next.js, featuring an AI opponent powered by the Shapes API. Players can choose from three difficulty levels (Normal, Hard, Extreme) and engage in trash-talk via a chat interface.

![Shape Games](https://i.imgur.com/DziE7ZN.png)

play here
https://tic-tac-toe-shapes.vercel.app
## Features
- **Gameplay**: Play as X against an Shape (O) on a 3x3 grid.
- **Difficulty Levels**:
  - Normal: Strategic moves with center/corner preference.
  - Hard: Aims to win or force a draw, blocks player wins.
  - Extreme: Optimal moves, prioritizes wins and traps.
   
## Needs
- Node.js >= 18
- npm or yarn
- Shapes API credentials (`SHAPE_USERNAME`, `SHAPE_API_KEY`)

## Installation
1. Clone the repository:
   ```bash
   cd shape-tictactoe
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Edit the `.env` file in the root directory:
   ```env
   SHAPE_USERNAME=your_shapes_username
   SHAPE_API_KEY=your_shapes_api_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

## Usage
- **Start a Game**: Select a difficulty (Normal, Hard, Extreme) and click a square to place your X.
- **Chat**: Type a message in the chatbox to taunt the AI; it will respond with trash-talk.
- **New Game**: Click "New Game" to reset the board.
- **Game Status**: Check the status bar for turn info, win/loss, or tie.

## Fallback Mechanism
If the Shapes API fails, the game falls back to:
- **Normal**: Heuristic-based move (win, block, center, corners, edges).
- **Hard/Extreme**: Minimax algorithm for optimal moves.

## Contributing
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

## License 
MIT ig? do whatever you want idc 
