# Shapes Whodunit

**Shapes Whodunit** is an interactive, mystery-solving game built with Shapes, Inc. API, where players investigate eerie crimes to uncover the culprit among a cast of suspicious shapes. Engage with a narrator and suspects through a chat interface, gather clues, vote off suspects, and solve the mystery before the culprit escapes! 

## Features

- **Immersive Mysteries**: Choose from 30+ unique cases (e.g., *The Phantom Heist*, *Curse of the Crimson Gem*) or play a random mystery, each with rich, atmospheric descriptions.
- **Interactive Chat**: Communicate with the Narrator and suspects via a scrollable chatbox, using `@mentions` to direct questions and uncover clues.
- **Dynamic Gameplay**: Vote off suspects, bring one back, and narrow down the culprit. Win by catching the culprit, or lose if they escape!
- **Responsive Design**: Fully responsive UI with mobile-friendly layouts and adaptive chatbox heights.
- **Dark Mode**: Seamless light and dark theme support for a polished user experience.
- **Save/Load Cases**: Save your progress locally and resume investigations later.
- **Customizable Shapes**: Configure Narrator and suspect usernames via environment variables or local storage.

## Demo
[shapewhodunit.vercel.app](https://shapewhodunit.vercel.app/)  

# Installation

### Prerequisites

- **Node.js**: Version 18.x or higher
- **npm** or **yarn**: For package management
- **Git**: To clone the repository

## Clone the Repository

```bash
git clone https://github.com/shapesinc/shapes-api/tree/main/examples/games/shape-whodunit
cd shape-whodunit
```
Install 
```bash
npm install
```
Or, if using Yarn:
```bash
yarn install
```
Set Up Environment VariablesCreate a `.env` file in the root directory and add the following:
```env
SHAPES_API_KEY=apikey
NEXT_PUBLIC_NARRATOR_SHAPE=shapename
NEXT_PUBLIC_SUSPECT_A_SHAPE=shapeaname
NEXT_PUBLIC_SUSPECT_B_SHAPE=shapebname
NEXT_PUBLIC_SUSPECT_C_SHAPE=shapecname
```
Replace narrator-username, etc., with valid Shape usernames. These connect to the Shapes API for chat interactions.

Run the Development Server
```bash
npm run dev
```

Or with Yarn:
```bash
yarn dev
```
Open http://localhost:3000 in your browser to play the game.

Build for Production
```bash
npm run build
npm run start
```
Or with Yarn:
```bash
yarn build
yarn start
```
## Usage
- Start a Game:
Select a case from the list or choose a random mystery.
Click Start Investigation to begin.
- Investigate:
Use the chatbox to ask the Narrator (@narrator) or suspects (@a, @b, @c) questions.
Look for bold clues and italic hints in responses to piece together the mystery.
Clues appear in the "Clues Discovered" section below the suspect list.
- Vote Off Suspects:
Click Vote Off next to a suspect to remove them from the game.
Use Bring Back to restore one voted-off suspect (one-time action).
- Win or Lose:
Narrow down to one suspect. If they’re the culprit, you win! If not, the culprit escapes, and you lose.
Save your progress with Save This Case to resume later.
- Customize Shapes:
Modify suspect and narrator usernames in settings.

## Contributing
We welcome contributions to make Shapes Whodunit even better! To contribute:
Fork the Repository: Click the "Fork" button on GitHub.

Clone Your Fork:
```bash
git clone https://github.com/shapesinc/shapes-api/tree/main/examples/games/shape-whodunit
cd shapes-whodunit
```
Create a Branch:
```bash
git checkout -b feature/your-feature-name
```

Make Changes: Implement your feature, bug fix, or improvement.
Test: Ensure your changes work locally (npm run dev) and don’t break existing functionality.

Commit Changes:
```bash
git add .
git commit -m "Add your feature or fix description"
```
Push to Your Fork:
```bash
git push origin feature/your-feature-name
```

Open a Pull Request: Go to the original repository and create a PR with a clear description of your changes.

## Issues
Found a bug or have a feature request? Open an issue. Please include:
- A clear description of the issue or feature.
- Steps to reproduce (for bugs).
- Screenshots or logs, if applicable.

License 
MIT idk
