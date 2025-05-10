#!/usr/bin/env python3
import logging
import os

from bot import create_and_run_bot
from app import app  # Import the Flask app for gunicorn

if __name__ == "__main__":
    # Set up logging
    logging.basicConfig(
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        level=logging.INFO
    )
    logger = logging.getLogger(__name__)
    
    # Make sure the required environment variables are set
    telegram_token = os.environ.get("TELEGRAM_TOKEN")
    shapes_api_key = os.environ.get("SHAPES_API_KEY")
    shapes_model = os.environ.get("SHAPES_MODEL")
    
    if not telegram_token:
        logger.error("TELEGRAM_TOKEN not found in environment variables")
        exit(1)
    
    if not shapes_api_key:
        logger.error("SHAPES_API_KEY not found in environment variables")
        exit(1)
    
    if not shapes_model:
        logger.warning("SHAPES_MODEL not found in environment variables, using default example model")
        # We continue anyway as we have a default in config.py
    
    # Start the bot
    create_and_run_bot()
