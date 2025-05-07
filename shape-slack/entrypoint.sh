#!/bin/bash
set -e

# Get port from environment or use default
PORT="${PORT:-3000}"

echo "Starting server on port $PORT..."

# Create logs directory if it doesn't exist
mkdir -p /app/logs

# Create log file if it doesn't exist
touch /app/logs/log.txt

# The tee command sends output to both the file and standard output
# This preserves console logging while also saving everything to the log file
exec gunicorn --bind "0.0.0.0:$PORT" --workers 2 --timeout 120 main:flask_app 2>&1 | tee -a /app/logs/log.txt
