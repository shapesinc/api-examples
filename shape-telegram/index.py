#!/usr/bin/env python3
import logging
import os
from typing import Dict, Optional, Set, Tuple, List, Any
import json
import threading
from flask import Flask, render_template_string
from telegram import Update, Message, Bot
from telegram.constants import ParseMode
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters
)

# Set up logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Constants
TELEGRAM_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
SHAPES_API_KEY = os.environ.get("SHAPES_API_KEY", "")
API_BASE_URL = os.environ.get("API_BASE_URL", "https://api.shapes.studio/v1")
WELCOME_MESSAGE = """
👋 Welcome to the Shapes Telegram Bot!

I'm powered by Shapes AI and can have natural conversations about almost anything.

In a group chat, you can activate me by:
- Mentioning me with @
- Replying to one of my messages
- Using the /start command to enable auto-reply mode

Commands:
/start - Enable auto-reply mode (I'll respond to all messages)
/stop - Disable auto-reply mode (I'll only respond when mentioned)
/reset - Clear the conversation history

Enjoy chatting!
"""
RATE_LIMIT_MESSAGE = "I'm getting too many requests right now. Please try again in a few minutes."
MEDIA_RESPONSE = "I don't have vision capabilities yet, so I can't see images or videos."
ACCESS_CHECK_ENABLED = os.environ.get("ACCESS_CHECK_ENABLED", "false").lower() == "true"
BOT_ADMIN_PASSWORD = os.environ.get("BOT_ADMIN_PASSWORD", "admin")

# Web server
app = Flask(__name__)

@app.route('/')
def index():
    """Simple status page"""
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Telegram Bot Status</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
                color: #333;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                background-color: white;
                padding: 20px;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            h1 {
                color: #0088cc;
            }
            .status {
                padding: 10px 15px;
                background-color: #d4edda;
                color: #155724;
                border-radius: 3px;
                margin: 15px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Telegram Bot Status</h1>
            <div class="status">
                <p><strong>Bot Status: Running</strong></p>
                <p>The Telegram bot can be accessed via Telegram.</p>
            </div>
            <p>This is a Shapes API integration for Telegram.</p>
        </div>
    </body>
    </html>
    """
    return render_template_string(html)

# Conversation Manager
class ConversationManager:
    def __init__(self):
        self.conversations = {}
        self.auto_reply_enabled = {}
    
    def get_conversation_id(self, chat_id, thread_id=None):
        """Generate a conversation ID from chat_id and thread_id."""
        if thread_id:
            return f"{chat_id}:{thread_id}"
        return str(chat_id)
    
    def add_message(self, conversation_id, role, content, user_id=None):
        """Add a message to the conversation history."""
        if conversation_id not in self.conversations:
            self.conversations[conversation_id] = []
        
        message = {"role": role, "content": content}
        
        # Add user ID for user messages if provided
        if user_id and role == "user":
            message["user_id"] = user_id
        
        self.conversations[conversation_id].append(message)
    
    def get_conversation_history(self, conversation_id):
        """Get the conversation history."""
        return self.conversations.get(conversation_id, [])
    
    def reset_conversation(self, conversation_id):
        """Reset the conversation history."""
        self.conversations[conversation_id] = []
    
    def enable_auto_reply(self, conversation_id):
        """Enable auto-reply for a conversation."""
        self.auto_reply_enabled[conversation_id] = True
    
    def disable_auto_reply(self, conversation_id):
        """Disable auto-reply for a conversation."""
        self.auto_reply_enabled[conversation_id] = False
    
    def is_auto_reply_enabled(self, conversation_id):
        """Check if auto-reply is enabled for a conversation."""
        return self.auto_reply_enabled.get(conversation_id, False)

# Shapes Client
class ShapesClient:
    def __init__(self, api_key=None, api_base=None):
        self.api_key = api_key or SHAPES_API_KEY
        self.api_base = api_base or API_BASE_URL
    
    def generate_response(self, conversation_history):
        """Generate a response from the Shapes API."""
        try:
            import requests
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # Prepare the messages in the format expected by Shapes API
            messages = conversation_history
            
            data = {
                "messages": messages
            }
            
            # Make the API request
            response = requests.post(
                f"{self.api_base}/chat/completions",
                headers=headers,
                json=data,
                timeout=60
            )
            
            # Check for rate limit or error
            if response.status_code == 429:
                raise RateLimitExceeded("Rate limit exceeded")
            
            response.raise_for_status()
            
            # Parse the response
            response_data = response.json()
            
            # Extract the response text
            if "choices" in response_data and len(response_data["choices"]) > 0:
                message = response_data["choices"][0].get("message", {})
                content = message.get("content", "")
                return content
            
            return "I'm not sure how to respond to that."
            
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            if "Rate limit" in str(e):
                raise RateLimitExceeded("Rate limit exceeded")
            raise

class RateLimitExceeded(Exception):
    """Exception raised when the API rate limit is exceeded."""
    pass

# Access Manager
class AccessManager:
    def __init__(self, admin_password="admin"):
        self.admin_password = admin_password
        self.pending_approvals = {}
        self.approved_chats_file = "approved_chats.json"
        self.approved_chats = self._load_approved_chats()
    
    def _load_approved_chats(self):
        """Load the list of approved chats from the file."""
        try:
            if os.path.exists(self.approved_chats_file):
                with open(self.approved_chats_file, 'r') as f:
                    return json.load(f)
            return []
        except Exception as e:
            logger.error(f"Error loading approved chats: {str(e)}")
            return []
    
    def _save_approved_chats(self):
        """Save the list of approved chats to the file."""
        try:
            with open(self.approved_chats_file, 'w') as f:
                json.dump(self.approved_chats, f)
        except Exception as e:
            logger.error(f"Error saving approved chats: {str(e)}")
    
    def is_chat_approved(self, chat_id):
        """Check if a chat is approved."""
        return str(chat_id) in self.approved_chats or chat_id in self.approved_chats
    
    def register_pending_approval(self, user_id, chat_id):
        """Register a pending approval."""
        self.pending_approvals[user_id] = chat_id
    
    def approve_chat(self, user_id, password):
        """Approve a chat."""
        if user_id not in self.pending_approvals:
            return {"success": False, "message": "No pending approval found."}
        
        if password != self.admin_password:
            return {"success": False, "message": "Incorrect password. Please try again."}
        
        chat_id = self.pending_approvals[user_id]
        str_chat_id = str(chat_id)
        
        if str_chat_id in self.approved_chats:
            del self.pending_approvals[user_id]
            return {"success": True, "message": f"Chat {chat_id} is already approved!"}
        
        self.approved_chats.append(str_chat_id)
        self._save_approved_chats()
        
        del self.pending_approvals[user_id]
        
        return {"success": True, "message": f"Success! Chat {chat_id} has been approved."}
    
    def direct_approve_chat(self, chat_id, password):
        """Directly approve a chat with password."""
        if password != self.admin_password:
            return {"success": False, "message": "Incorrect password. Please try again."}
        
        str_chat_id = str(chat_id)
        
        if str_chat_id in self.approved_chats:
            return {"success": True, "message": f"Chat {chat_id} is already approved!"}
        
        self.approved_chats.append(str_chat_id)
        self._save_approved_chats()
        
        return {"success": True, "message": f"Success! Chat {chat_id} has been approved."}
    
    def revoke_access(self, chat_id, password):
        """Revoke access for a chat."""
        if password != self.admin_password:
            return {"success": False, "message": "Incorrect password. Please try again."}
        
        str_chat_id = str(chat_id)
        
        if str_chat_id not in self.approved_chats:
            return {"success": False, "message": f"Chat {chat_id} is not in the approved list."}
        
        self.approved_chats.remove(str_chat_id)
        self._save_approved_chats()
        
        return {"success": True, "message": f"Access for chat {chat_id} has been revoked."}

# Utility functions
def extract_command_for_bot(bot, text):
    """Extract command for this specific bot from text."""
    if not text:
        return None
    
    # Handle normal commands like "/start" without bot mention
    if text.startswith('/'):
        command = text.split(' ')[0]  # Extract command part
        command = command.lstrip('/')  # Remove leading slash
        remaining = text[len(command) + 1:].strip()  # Get remaining text
        return (command, remaining)
    
    # Handle commands with bot mention like "@mybot start"
    bot_username = bot.username.lower()
    if f"@{bot_username}" in text.lower():
        parts = text.split(' ')
        command_index = -1
        
        # Find the bot mention
        for i, part in enumerate(parts):
            if part.lower() == f"@{bot_username}":
                command_index = i
                break
        
        # If found and there's a command after the mention
        if command_index >= 0 and command_index + 1 < len(parts):
            command = parts[command_index + 1]
            remaining = ' '.join(parts[command_index + 2:])
            return (command, remaining)
    
    return None

def is_bot_mentioned(bot, message):
    """Check if the bot is mentioned in the message."""
    if not message.text:
        return False
    
    bot_username = bot.username.lower()
    return f"@{bot_username}" in message.text.lower()

def is_reply_to_bot(bot, message):
    """Check if the message is a reply to the bot."""
    return message.reply_to_message and message.reply_to_message.from_user.id == bot.id

def get_user_identifier(user):
    """Get a user identifier string."""
    if user.username:
        return f"@{user.username}"
    return f"{user.first_name} ({user.id})"

# Telegram bot handlers
async def get_access_command(update, context):
    """Handle the getaccess command to provide users with their chat ID."""
    if not update.effective_message or not update.effective_user:
        return
    
    chat_id = update.effective_chat.id
    user_id = update.effective_user.id
    
    # Display chat ID for the user with different instructions based on chat type
    if update.effective_chat.type == "private":
        # In private chats, users can approve themselves directly
        await update.effective_message.reply_text(
            f"📋 Your Chat ID: {chat_id}\n\n"
            f"Since you're in a direct message with me already, you can approve yourself by using:\n"
            f"@{context.bot.username} giveaccess\n\n"
            f"Then enter this chat ID and the admin password when prompted."
        )
    else:
        # In group chats, give clearer instructions
        await update.effective_message.reply_text(
            f"📋 This chat's ID is: {chat_id}\n\n"
            f"To approve this chat, please start a direct message with me and use:\n"
            f"@{context.bot.username} giveaccess\n\n"
            f"Then enter this chat ID ({chat_id}) and the admin password when prompted."
        )
    
    logger.info(f"User {update.effective_user.id} requested access for chat {chat_id}")

async def start_command(update, context):
    """Handle the /start command to send welcome message and instructions."""
    if not update.effective_message or not update.effective_user:
        return
    
    chat_id = update.effective_chat.id
    user_id = update.effective_user.id
    
    # If this is a private chat and the user hasn't been welcomed, send the welcome message
    if update.effective_chat.type == "private" and user_id not in welcomed_users:
        await update.effective_message.reply_text(WELCOME_MESSAGE)
        welcomed_users.add(user_id)
    
    # Send confirmation message
    await update.effective_message.reply_text(
        "I'm now in auto-reply mode. I'll respond to all messages in this chat."
    )
    
    # Enable auto-reply for this conversation
    conversation_id = conversation_manager.get_conversation_id(
        chat_id, 
        update.effective_message.message_thread_id
    )
    conversation_manager.enable_auto_reply(conversation_id)

async def handle_message(update, context):
    """Handle incoming messages, process commands, and generate responses."""
    if not update.effective_message or not update.effective_user:
        return
    
    message = update.effective_message
    chat_id = update.effective_chat.id
    user_id = update.effective_user.id
    user_identifier = get_user_identifier(update.effective_user)
    
    # Generate a unique conversation ID for this context
    conversation_id = conversation_manager.get_conversation_id(
        chat_id, 
        message.message_thread_id
    )
    
    # Store message in context if it has text content
    if message.text and update.effective_chat.type in ["group", "supergroup"]:
        conversation_manager.add_message(
            conversation_id=conversation_id,
            role="user",
            content=message.text,
            user_id=user_id
        )
    
    # Handle media message
    if message.photo or message.video or message.document or message.voice or message.audio:
        logger.info(f"Received media message from {user_identifier}")
        await message.reply_text(MEDIA_RESPONSE)
        return
    
    # If no text in the message, ignore it
    if not message.text:
        return
    
    # Check for explicit commands for this bot
    bot_command = extract_command_for_bot(context.bot, message.text)
    if bot_command:
        command, remaining_text = bot_command
        command = command.lower()
        logger.info(f"Received command '{command}' from {user_identifier}")
        
        # Handle commands
        if command == "getaccess" or command == "getacess":
            await get_access_command(update, context)
            return
        
        if command == "start":
            # Enable auto-reply for this conversation
            conversation_manager.enable_auto_reply(conversation_id)
            await message.reply_text("Auto-reply mode enabled. I'll respond to all messages in this chat.")
            return
            
        elif command == "stop":
            # Disable auto-reply for this conversation
            conversation_manager.disable_auto_reply(conversation_id)
            await message.reply_text("Auto-reply mode disabled. I'll only respond when mentioned or replied to.")
            return
            
        elif command == "reset":
            # Reset the conversation history
            conversation_manager.reset_conversation(conversation_id)
            await message.reply_text("Conversation history has been reset.")
            return
    
    # Check if the bot should respond
    should_respond = False
    
    # For private chats, always respond
    if update.effective_chat.type == "private":
        should_respond = True
    # For group chats and other chat types, check conditions
    else:
        auto_reply_enabled = conversation_manager.is_auto_reply_enabled(conversation_id)
        bot_mentioned = is_bot_mentioned(context.bot, message)
        reply_to_bot = is_reply_to_bot(context.bot, message)
        
        # Respond if any of these conditions are true
        if auto_reply_enabled or bot_mentioned or reply_to_bot:
            should_respond = True
    
    # If we shouldn't respond, exit early
    if not should_respond:
        return
    
    # For private chats, we need to add the message to the context here
    if update.effective_chat.type == "private":
        conversation_manager.add_message(
            conversation_id=conversation_id,
            role="user",
            content=message.text,
            user_id=user_id
        )
    
    # Send "typing..." indicator
    await context.bot.send_chat_action(chat_id=chat_id, action="typing")
    
    try:
        # Get conversation history
        conversation_history = conversation_manager.get_conversation_history(conversation_id)
        
        # Generate response using Shapes API
        ai_response = shapes_client.generate_response(
            conversation_history=conversation_history
        )
        
        # Save the assistant response to conversation history
        conversation_manager.add_message(
            conversation_id=conversation_id,
            role="assistant",
            content=ai_response
        )
        
        # Send the response
        await message.reply_text(ai_response, parse_mode=ParseMode.MARKDOWN)
        
    except RateLimitExceeded:
        await message.reply_text(RATE_LIMIT_MESSAGE)
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        await message.reply_text("Sorry, there was an error processing your request.")

def create_and_run_bot():
    """Initialize and run the Telegram bot."""
    application = Application.builder().token(TELEGRAM_TOKEN).build()
    
    # Add handlers
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("stop", lambda update, context: handle_message(update, context)))
    application.add_handler(CommandHandler("reset", lambda update, context: handle_message(update, context)))
    application.add_handler(CommandHandler("getaccess", get_access_command))
    
    # Add message handler for all other messages
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    # Start the bot
    application.run_polling()

# Initialize global instances
conversation_manager = ConversationManager()
shapes_client = ShapesClient()
access_manager = AccessManager(admin_password=BOT_ADMIN_PASSWORD)

# Track users who have received the welcome message
welcomed_users = set()

def run_flask():
    """Run the Flask web server."""
    from waitress import serve
    serve(app, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))

if __name__ == "__main__":
    # Check if we have a valid Telegram token
    if not TELEGRAM_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN not found in environment variables")
        exit(1)
    
    # Check if we have a valid Shapes API key
    if not SHAPES_API_KEY:
        logger.error("SHAPES_API_KEY not found in environment variables")
        exit(1)
    
    # Start the web server in a separate thread
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.daemon = True
    flask_thread.start()
    
    # Start the bot in the main thread
    logger.info("Starting Telegram bot...")
    create_and_run_bot() 