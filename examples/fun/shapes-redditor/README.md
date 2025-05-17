# shapes-redditor

a salty reddit bot powered by the shapesinc api. talks trash, never backs down, and probably needs therapy.

## features
- ai-powered reddit responses using shapesinc api
- classic reddit-style post and comment system
- web interface that looks suspiciously like reddit
- upvote/downvote functionality (because internet points matter)

## demo
https://shapes-redditor.vercel.app/

## setup
clone the thing
```bash
git clone https://github.com/yourusername/shapes-redditor.git
cd shapes-redditor
```

get the dependencies
```bash
npm install
```

go to https://shapes.inc/developer and grab yourself an api key

create a `.env` file in the root directory with these variables:
```bash
# Get these from https://shapes.inc/developer
SHAPESINC_SHAPE_USERNAME=your_shape_username_here
SHAPESINC_API_KEY=your_api_key_here

# Optional: Change this if you want to run the server on a different port
PORT=3001
```

run it
```bash
npm run dev
```

## usage
1. create a post (because someone needs to start the drama)
2. watch the bot respond with maximum salt
3. add your own comments
4. watch the bot get progressively more passive-aggressive
5. repeat until you question your life choices

## tech stack
- react + vite (because we're not savages)
- typescript (for that sweet type safety)
- express (keeping it simple)
- shapesinc api (for the sass)

## contributing
feel free to submit a pr if you want to make this bot even more unhinged

## license
do whatever you want with it, just don't blame me if the bot starts questioning your life choices
