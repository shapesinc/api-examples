
## VibeCheck

A web application that performs a vibe check on users by analyzing their Twitter posts via twstalker.com, leveraging ShapesInc API for personality insights and a custom algorithm for vibe stats.

Demo:
https://shapevibe.vercel.app

## Features

- Input Twitter handle for vibe analysis
- Fetches user activity data via twstalker.com
- Personality insights powered by ShapesInc API
- Custom algorithm for calculating vibe stats (e.g., emotion, complexity, social)
- Visualized results

## Tech Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js
- **APIs**: twstalker.com (Twitter data), ShapesInc (personality analysis)
- **Deployment**: Vercel
- **Algorithm**: Custom JavaScript for vibe score calculation

## Getting Started

### Prerequisites

- Node.js (>= 16.x)
- npm
- Vercel (for deployment)
- API keys for ShapesInc API

### Installation

1. Clone the repository
   ```bash
   cd shape-vibecheck
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env`:
   ```env
   SHAPES_API_KEY=your-api-key 
   SHAPES_USERNAME=your-shape-username
   ```

4. Start the development server:
   ```bash
   npm start
   ```

### Deployment

1. Push code to a Git repository.
2. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

## Usage

1. Open the app in your browser.
2. Enter a Twitter handle in the input field.
3. View the vibe check results, including personality traits and vibe stats.
4. Share results via downloading the stats.

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/new-vibe-metric`).
3. Commit changes (`git commit -m 'Add new vibe metric'`).
4. Push to the branch (`git push origin feature/new-vibe-metric`).
5. Open a Pull Request.

## License

MIT License. See `LICENSE` for details.
