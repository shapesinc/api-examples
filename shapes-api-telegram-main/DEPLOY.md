# Deployment Checklist for Shapes Inc Telegram Bot

## Environment Secrets
Make sure the following secrets are set in the Replit environment:
- [ ] `TELEGRAM_TOKEN` - Your Telegram bot token from BotFather
- [ ] `SHAPES_API_KEY` - Your Shapes Inc API key
- [ ] `BOT_ADMIN_PASSWORD` - Password for approving access to the bot
- [ ] `SHAPES_MODEL` - Your specific Shapes Inc model ID (REQUIRED)

## Deployment Settings
In your Replit Reserved VM deployment settings, use one of these options:

### Recommended Option (Best Chance of Success)
1. [ ] Set Run command to: `./deploy.sh`  
2. [ ] Set Build command to: none
3. [ ] VM Resources: Min Resources (0.25 CPU/1 GB RAM) - Background Worker

### Alternative Option (If the above fails)
1. [ ] Set Run command to: `./start_script.sh`  
2. [ ] Set Build command to: none
3. [ ] VM Resources: Min Resources (0.25 CPU/1 GB RAM) - Background Worker

### As a Last Resort
1. [ ] Set Run command to: `python main.py`
2. [ ] Set Build command to: none

## Files to Check
Make sure these files exist and have the right content:
1. [ ] `app.py` - Flask web server for Replit deployment
2. [ ] `main.py` - Telegram Shape startup code
3. [ ] `shapes_client.py` - Client for Shapes Inc API

## Testing Before Deployment
Run these commands to ensure everything works:
1. [ ] `python app.py` - Test the web server works
2. [ ] `python main.py` - Test the Shape works

## Common Issues
- If environment variables are missing, add them in Replit Secrets
- If the web server fails to start, check app.py
- If the Shape fails to start, check main.py and api keys