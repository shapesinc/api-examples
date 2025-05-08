#!/bin/bash

# Extremely simple script for Replit deployment
# Start the simple HTTP server on port 5000 in the background
python -m http.server 5000 &

# Run the Telegram bot in the foreground
exec python main.py