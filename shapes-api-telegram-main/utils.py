import logging
from typing import Optional, Tuple

from telegram import Bot, Message, Update, User

logger = logging.getLogger(__name__)

def extract_command_for_bot(bot: Bot, message_text: str) -> Optional[Tuple[str, str]]:
    """
    Extract a command specifically targeted at this bot.
    
    Args:
        bot: The Telegram bot instance
        message_text: The message text to analyze
        
    Returns:
        A tuple of (command, remaining_text) if found, None otherwise
    """
    if not message_text:
        return None
    
    # Get the bot's username
    bot_username = bot.username.lower() if bot.username else None
    if not bot_username:
        return None
    
    # Check if the message starts with '@botusername command'
    tokens = message_text.strip().split()
    if len(tokens) >= 2 and tokens[0].startswith('@'):
        mentioned_username = tokens[0][1:].lower()  # Remove the '@' and lowercase
        
        if mentioned_username == bot_username:
            command = tokens[1].lower()
            remaining_text = ' '.join(tokens[2:])
            return command, remaining_text
    
    return None

def is_bot_mentioned(bot: Bot, message: Message) -> bool:
    """
    Check if the bot is mentioned in the message.
    
    Args:
        bot: The Telegram bot instance
        message: The Telegram message
        
    Returns:
        Boolean indicating whether the bot is mentioned
    """
    if not message.text:
        return False
    
    # Get the bot's username
    bot_username = bot.username.lower() if bot.username else None
    if not bot_username:
        return False
    
    # Check for mentions in the format @username
    if f"@{bot_username}" in message.text.lower():
        return True
    
    # Check for mentions in message entities
    if message.entities:
        for entity in message.entities:
            if entity.type == "mention":
                mention = message.text[entity.offset:entity.offset + entity.length]
                if mention.lower() == f"@{bot_username}":
                    return True
    
    return False

def is_reply_to_bot(bot: Bot, message: Message) -> bool:
    """
    Check if the message is a reply to one of the bot's messages.
    
    Args:
        bot: The Telegram bot instance
        message: The Telegram message
        
    Returns:
        Boolean indicating whether the message is a reply to the bot
    """
    # Check if the message is a reply
    if not message.reply_to_message:
        return False
    
    # Check if the replied-to message was from the bot
    replied_to = message.reply_to_message
    if replied_to.from_user and replied_to.from_user.id == bot.id:
        return True
    
    return False

def get_user_identifier(user: User) -> str:
    """
    Get a user identifier for logging and display purposes.
    
    Args:
        user: The Telegram user
        
    Returns:
        A string identifier for the user
    """
    components = []
    
    if user.first_name:
        components.append(user.first_name)
    
    if user.last_name:
        components.append(user.last_name)
    
    if user.username:
        components.append(f"@{user.username}")
    
    identifier = " ".join(components)
    if identifier:
        return f"{identifier} (ID: {user.id})"
    else:
        return f"User ID: {user.id}"
