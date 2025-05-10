#!/bin/bash

# Make script exit if any command fails
set -e

echo "Starting Telegram Bot deployment..."

# Make sure required environment variables are set
if [ -z "$TELEGRAM_TOKEN" ]; then
  echo "ERROR: TELEGRAM_TOKEN environment variable is not set!"
  exit 1
fi

if [ -z "$SHAPES_API_KEY" ]; then
  echo "ERROR: SHAPES_API_KEY environment variable is not set!"
  exit 1
fi

if [ -z "$BOT_ADMIN_PASSWORD" ]; then
  echo "ERROR: BOT_ADMIN_PASSWORD environment variable is not set!"
  exit 1
fi

# Start the Flask web server (to satisfy Replit deployment requirements)
echo "Starting Flask web server on port 5000 in the background..."
if [ -x "$(command -v gunicorn)" ]; then
  gunicorn --bind 0.0.0.0:5000 --daemon --access-logfile - --error-logfile - main:app
else
  python -m flask run --host=0.0.0.0 --port=5000 &
fi

# Start the Telegram bot
echo "Starting Telegram bot..."
exec python main.py