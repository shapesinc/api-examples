#!/usr/bin/env python3
"""
Ultra simple script that runs both a web server and the bot in a single process.
This is meant to be the most reliable way to deploy on Replit.
"""
import logging
import os
import subprocess
import threading
import time

# Set up logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

def run_http_server():
    """Run a simple HTTP server on port 5000 to satisfy Replit."""
    logger.info("Starting HTTP server on port 5000...")
    try:
        # Try to run Python's built-in HTTP server
        subprocess.Popen(["python", "-m", "http.server", "5000"])
        logger.info("HTTP server started successfully.")
    except Exception as e:
        logger.error(f"Failed to start HTTP server: {e}")
        
def run_telegram_bot():
    """Run the Telegram bot."""
    logger.info("Starting Telegram bot...")
    try:
        # Run the main.py script directly
        # Using os.execv to replace the current process with main.py
        os.execv("/usr/bin/python3", ["python3", "main.py"])
    except Exception as e:
        logger.error(f"Failed to start Telegram bot: {e}")

if __name__ == "__main__":
    # Check environment variables
    telegram_token = os.environ.get("TELEGRAM_TOKEN")
    shapes_api_key = os.environ.get("SHAPES_API_KEY")
    
    if not telegram_token:
        logger.error("TELEGRAM_TOKEN not found in environment variables")
        exit(1)
    
    if not shapes_api_key:
        logger.error("SHAPES_API_KEY not found in environment variables")
        exit(1)
    
    # Start the HTTP server in a separate thread
    http_thread = threading.Thread(target=run_http_server)
    http_thread.daemon = True  # Make thread a daemon so it exits when main thread exits
    http_thread.start()
    
    # Give the HTTP server a moment to start
    time.sleep(2)
    
    # Run the Telegram bot in the main thread
    run_telegram_bot()