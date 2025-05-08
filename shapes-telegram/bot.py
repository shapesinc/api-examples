import logging
import os
from typing import Dict, Optional, Set, Tuple, List, Any

from telegram import Update, Message, Bot
from telegram.constants import ParseMode
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters
)

from config import (
    TELEGRAM_TOKEN, WELCOME_MESSAGE, 
    RATE_LIMIT_MESSAGE, 
    BOT_ADMIN_PASSWORD, ACCESS_CHECK_ENABLED
)

# Constants that were removed from config
MEDIA_RESPONSE = "i am blind help! i dont have vision to see images yet"  # Changed to acknowledge we can see images
from conversation_manager import ConversationManager
from shapes_client import ShapesClient, RateLimitExceeded
from utils import extract_command_for_bot, is_bot_mentioned, is_reply_to_bot, get_user_identifier
from access_manager import AccessManager

# Set up logging
logger = logging.getLogger(__name__)

# Initialize global instances
conversation_manager = ConversationManager()
shapes_client = ShapesClient()
access_manager = AccessManager(admin_password=BOT_ADMIN_PASSWORD)

# Track users who have received the welcome message
welcomed_users: Set[int] = set()

# Track users in password approval flow
users_in_approval_flow: Dict[int, Dict[str, Any]] = {}

async def get_access_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
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

async def approve_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the approve command to directly approve a chat ID with password."""
    if not update.effective_message or not update.effective_user:
        return
    
    # Only allow this command in private chats
    if update.effective_chat.type != "private":
        await update.effective_message.reply_text(
            "For security, the approve command can only be used in private messages. "
            "Please send me a direct message."
        )
        return
    
    user_id = update.effective_user.id
    
    # Start the direct approval flow
    users_in_approval_flow[user_id] = {"step": "direct_chat_id", "type": "approve"}
    
    await update.effective_message.reply_text(
        "Please enter the chat ID you want to approve directly:"
    )
    
    logger.info(f"User {user_id} started the direct access approval flow")

async def revoke_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the revoke command to remove access for a chat ID."""
    if not update.effective_message or not update.effective_user:
        return
    
    # Only allow this command in private chats
    if update.effective_chat.type != "private":
        await update.effective_message.reply_text(
            "For security, the revoke command can only be used in private messages. "
            "Please send me a direct message."
        )
        return
    
    user_id = update.effective_user.id
    
    # Start the revoke flow
    users_in_approval_flow[user_id] = {"step": "revoke_chat_id", "type": "revoke"}
    
    await update.effective_message.reply_text(
        "Please enter the chat ID you want to revoke access for:"
    )
    
    logger.info(f"User {user_id} started the access revocation flow")

async def give_access_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the giveaccess command to approve chat IDs with password."""
    if not update.effective_message or not update.effective_user:
        return
    
    # Only allow this command in private chats
    if update.effective_chat.type != "private":
        await update.effective_message.reply_text(
            "For security, the giveaccess command can only be used in private messages. "
            "Please send me a direct message."
        )
        return
    
    user_id = update.effective_user.id
    
    # Start the approval flow
    users_in_approval_flow[user_id] = {"step": "chat_id", "type": "giveaccess"}
    
    await update.effective_message.reply_text(
        "Please enter the chat ID you want to approve.\n\n"
        "If you don't know the chat ID, use the command '@getaccess' in the chat you want to approve."
    )
    
    logger.info(f"User {user_id} started the access approval flow")

async def handle_approval_flow(update: Update, context: ContextTypes.DEFAULT_TYPE) -> bool:
    """
    Handle the approval flow for granting access.
    
    Returns:
        Boolean indicating whether the message was handled by the approval flow
    """
    if not update.effective_message or not update.effective_user:
        return False
    
    user_id = update.effective_user.id
    
    # Check if user is in approval flow
    if user_id not in users_in_approval_flow:
        return False
    
    flow_state = users_in_approval_flow[user_id]
    message_text = update.effective_message.text
    flow_type = flow_state.get("type", "giveaccess")
    
    # Handle chat ID input for standard approval
    if flow_state["step"] == "chat_id":
        try:
            chat_id = int(message_text.strip())
            flow_state["chat_id"] = chat_id
            flow_state["step"] = "password"
            
            await update.effective_message.reply_text(
                f"Got it! Now please enter the admin password:"
            )
            
            logger.info(f"User {user_id} provided chat ID {chat_id} for approval")
            return True
            
        except ValueError:
            # Remove user from approval flow on invalid input
            del users_in_approval_flow[user_id]
            await update.effective_message.reply_text(
                "That doesn't look like a valid chat ID. The approval process has been canceled.\n\n"
                "Hint: Use the command '@getaccess' in the chat you want to approve to get its chat ID.\n\n"
                "Then use '@giveaccess' to start the approval process again."
            )
            logger.info(f"User {user_id} approval flow canceled due to invalid chat ID")
            return True
    
    # Handle direct chat ID approval
    elif flow_state["step"] == "direct_chat_id":
        try:
            chat_id = int(message_text.strip())
            flow_state["chat_id"] = chat_id
            flow_state["step"] = "direct_password"
            
            await update.effective_message.reply_text(
                f"Got it! Now please enter the admin password to approve chat ID {chat_id}:"
            )
            
            logger.info(f"User {user_id} provided chat ID {chat_id} for direct approval")
            return True
            
        except ValueError:
            # Remove user from approval flow on invalid input
            del users_in_approval_flow[user_id]
            await update.effective_message.reply_text(
                "That doesn't look like a valid chat ID. The approval process has been canceled.\n\n"
                "Hint: Use the command '@getaccess' in the chat you want to approve to get its chat ID.\n\n"
                "Then use '@giveaccess' to start the approval process again."
            )
            logger.info(f"User {user_id} direct approval flow canceled due to invalid chat ID")
            return True
    
    # Handle revoke chat ID
    elif flow_state["step"] == "revoke_chat_id":
        try:
            chat_id = int(message_text.strip())
            flow_state["chat_id"] = chat_id
            flow_state["step"] = "revoke_password"
            
            await update.effective_message.reply_text(
                f"Got it! Now please enter the admin password to revoke access for chat ID {chat_id}:"
            )
            
            logger.info(f"User {user_id} provided chat ID {chat_id} for revocation")
            return True
            
        except ValueError:
            # Remove user from approval flow on invalid input
            del users_in_approval_flow[user_id]
            await update.effective_message.reply_text(
                "That doesn't look like a valid chat ID. The process has been canceled.\n\n"
                "If you want to manually remove access for a chat, you'll need to edit the approved_chats.json file directly."
            )
            logger.info(f"User {user_id} revocation flow canceled due to invalid chat ID")
            return True
    
    # Handle password input for standard approval
    elif flow_state["step"] == "password":
        password = message_text.strip()
        chat_id = flow_state["chat_id"]
        
        # Register the chat ID for approval
        access_manager.register_pending_approval(user_id, chat_id)
        
        # Try to approve with the provided password
        result = access_manager.approve_chat(user_id, password)
        
        # Remove user from approval flow
        del users_in_approval_flow[user_id]
        
        # Send result message
        await update.effective_message.reply_text(result["message"])
        
        logger.info(f"User {user_id} completed approval flow for chat {chat_id}, result: {result['success']}")
        return True
    
    # Handle password input for direct approval
    elif flow_state["step"] == "direct_password":
        password = message_text.strip()
        chat_id = flow_state["chat_id"]
        
        # Try to directly approve with the provided password
        result = access_manager.direct_approve_chat(chat_id, password)
        
        # Remove user from approval flow
        del users_in_approval_flow[user_id]
        
        # Send result message
        await update.effective_message.reply_text(result["message"])
        
        logger.info(f"User {user_id} completed direct approval for chat {chat_id}, result: {result['success']}")
        return True
    
    # Handle password input for revocation
    elif flow_state["step"] == "revoke_password":
        password = message_text.strip()
        chat_id = flow_state["chat_id"]
        
        # Try to revoke access with the provided password
        result = access_manager.revoke_access(chat_id, password)
        
        # Remove user from approval flow
        del users_in_approval_flow[user_id]
        
        # Send result message
        await update.effective_message.reply_text(result["message"])
        
        logger.info(f"User {user_id} completed revocation for chat {chat_id}, result: {result['success']}")
        return True
    
    return False

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
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

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    Handle incoming messages, process commands, and generate responses.
    """
    if not update.effective_message or not update.effective_user:
        return
    
    message = update.effective_message
    chat_id = update.effective_chat.id
    user_id = update.effective_user.id
    user_identifier = get_user_identifier(update.effective_user)
    
    # Check if this is part of the approval flow
    if update.effective_chat.type == "private":
        if await handle_approval_flow(update, context):
            return
    
    # Generate a unique conversation ID for this context
    conversation_id = conversation_manager.get_conversation_id(
        chat_id, 
        message.message_thread_id
    )
    
    # Always store message in context (for all users) if it has text content
    # This ensures we capture the full conversation for context
    if message.text and update.effective_chat.type in ["group", "supergroup"]:
        conversation_manager.add_message(
            conversation_id=conversation_id,
            role="user",
            content=message.text,
            user_id=user_id
        )
        logger.debug(f"Added message from {user_identifier} to conversation context")
    
    # Handle media message (photo, video, document, etc.)
    # Instead of blocking, we process them as the LLM can see images
    if message.photo or message.video or message.document or message.voice or message.audio:
        logger.info(f"Received media message from {user_identifier}")
        # Acknowledge receipt of media but continue processing
        await message.reply_text(MEDIA_RESPONSE)
        # Note: we don't return here, so the conversation continues
    
    # If no text in the message, ignore it
    if not message.text:
        return
    
    # Check for explicit commands for this bot (like @mybot start)
    bot_command = extract_command_for_bot(context.bot, message.text)
    if bot_command:
        command, remaining_text = bot_command
        command = command.lower()  # Convert to lowercase for case-insensitive comparison
        logger.info(f"Received command '{command}' from {user_identifier}")
        
        # Handle getaccess command - ALWAYS allow this regardless of approval status
        if command == "getaccess" or command == "getacess":  # Handle common typo
            await get_access_command(update, context)
            return
            
        # Handle giveaccess command in private chats - ALWAYS allow this regardless of approval status
        if (command == "giveaccess" or command == "giveacess") and update.effective_chat.type == "private":
            await give_access_command(update, context)
            return
        
        # These commands only work for approved chats
        if access_manager.is_chat_approved(chat_id) or not ACCESS_CHECK_ENABLED:
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
    
    # First, handle commands that should always work regardless of approval status
    if bot_command:
        command_name = bot_command[0].lower()  # Convert to lowercase for case-insensitive matching
        
        # Handle getaccess command - ALWAYS allow this regardless of approval status
        if command_name == "getaccess" or command_name == "getacess":  # Handle common typo
            await get_access_command(update, context)
            return
            
        # Handle giveaccess command in private chats - ALWAYS allow this regardless of approval status
        if (command_name == "giveaccess" or command_name == "giveacess") and update.effective_chat.type == "private":
            await give_access_command(update, context)
            return
    
    # Check if this chat has access (if access control is enabled)
    if ACCESS_CHECK_ENABLED and not access_manager.is_chat_approved(chat_id):
        # Reply with access info for unapproved chats
        if update.effective_chat.type != "private":
            # For group chats, tell them how to get access
            await message.reply_text(
                f"This chat is not approved to use me.\n\n"
                f"Use the command: @{context.bot.username} getaccess\n\n"
                f"Then follow the instructions to approve this chat."
            )
        else:
            # For private chats, ask them to approve themselves
            await message.reply_text(
                f"You need to approve this chat first.\n\n"
                f"Type: @{context.bot.username} getaccess to get your chat ID\n\n"
                f"Then type: @{context.bot.username} giveaccess to approve with password."
            )
            
        logger.info(f"Ignoring message from {user_identifier} in unapproved chat {chat_id}")
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
            
            # Log the reason for responding
            if reply_to_bot:
                logger.info(f"Responding to {user_identifier} because they replied to a bot message")
            elif bot_mentioned:
                logger.info(f"Responding to {user_identifier} because they mentioned the bot")
            else:
                logger.info(f"Responding to {user_identifier} because auto-reply is enabled")
    
    # If we shouldn't respond, exit early
    if not should_respond:
        return
    
    # For private chats, we need to add the message to the context here
    # For group chats, we already added it at the beginning of the function
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
        
        # Generate response using Shapes Inc LLM through OpenAI compatibility layer
        # No system prompt required as backend handles it
        ai_response = shapes_client.generate_response(
            conversation_history=conversation_history
        )
        
        # Save the assistant response to conversation history
        conversation_manager.add_message(
            conversation_id=conversation_id,
            role="assistant",
            content=ai_response
        )
        
        # Send the main response
        await message.reply_text(ai_response, parse_mode=ParseMode.MARKDOWN)
        
    except RateLimitExceeded:
        await message.reply_text(RATE_LIMIT_MESSAGE)
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        
        # Provide a user-friendly error message based on the type of error
        if "API key" in str(e).lower() or "authorization" in str(e).lower():
            error_msg = "Sorry, there seems to be an issue with the API key. Please check your Shapes Inc API key."
        elif "failed to communicate" in str(e).lower():
            error_msg = "Sorry, I'm having trouble connecting to the Shapes. Please try again in a moment."
        elif "rate limit" in str(e).lower():
            error_msg = RATE_LIMIT_MESSAGE
        elif "invalid response" in str(e).lower():
            error_msg = "Sorry, I received an unexpected response from Shapes. This could be due to a temporary service issue."
        else:
            # For other errors, give a generic message
            error_msg = "Sorry, I encountered an error with Shapes. Please try again later."
            
        await message.reply_text(error_msg)

def create_and_run_bot():
    """Create and start the Telegram bot."""
    # Create the Application
    application = Application.builder().token(TELEGRAM_TOKEN).build()
    
    # Add handlers
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(MessageHandler(filters.ALL, handle_message))
    
    # Start the Bot
    logger.info("Starting bot...")
    application.run_polling()

if __name__ == "__main__":
    create_and_run_bot()
