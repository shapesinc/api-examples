#!/bin/bash
set -e

# Get port from environment or use default
PORT="${PORT:-8080}"

echo "Starting server on port $PORT..."


python main.py