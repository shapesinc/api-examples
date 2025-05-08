import os

# Telegram Bot Configuration
TELEGRAM_TOKEN = os.environ.get("TELEGRAM_TOKEN")

# Shapes Inc API Configuration
SHAPES_API_KEY = os.environ.get("SHAPES_API_KEY", "")
SHAPES_API_BASE = "https://api.shapes.inc/v1"
# Use environment variable for model name with a default example that doesn't reveal your actual model
SHAPES_MODEL = os.environ.get("SHAPES_MODEL", "shapes-model/example-model")   # The Shapes Inc model to use

# Bot Behavior Configuration
MAX_CONTEXT_MESSAGES = 1  # Only use the current message as the backend handles memory

# Custom welcome message when user first interacts with the bot
WELCOME_MESSAGE = """
Mr.E is back baby!

Commands you can use:
- @mybot start: Enable auto-reply mode
- @mybot stop: Disable auto-reply mode
- @mybot reset: Clear our conversation history

Access Control Commands:
- @mybot getaccess: Get the chat ID for approval (works in any chat)
- @mybot giveaccess: (DM only) Approve a chat ID with password

Feel free to ask me anything!
"""

# Response for media files
MEDIA_RESPONSE = "helo me i dont have vision yet"

# Rate limiting
RATE_LIMIT_MESSAGE = "sorry I've hit a rate limit, dude blame Shapes Inc okay"

# Default timeout for API requests (in seconds)
REQUEST_TIMEOUT = 60

# Access control
BOT_ADMIN_PASSWORD = os.environ.get("BOT_ADMIN_PASSWORD", "change-this-password")
ACCESS_CHECK_ENABLED = True  # Set to False to disable access checks completely
