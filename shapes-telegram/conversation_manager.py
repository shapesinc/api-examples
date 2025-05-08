import logging
from collections import defaultdict, deque
from typing import Dict, List, Set, Deque, Tuple, Optional

from config import MAX_CONTEXT_MESSAGES

logger = logging.getLogger(__name__)

class ConversationManager:
    """Manages separate conversation histories for different chat contexts."""
    
    def __init__(self):
        # Stores conversation history for each conversation context
        # Format: {conversation_id: deque([{"role": "user/assistant", "content": "message"}])}
        self.conversations: Dict[str, Deque[Dict[str, str]]] = defaultdict(lambda: deque(maxlen=MAX_CONTEXT_MESSAGES))
        
        # Stores which conversations have auto-reply enabled
        self.auto_reply_enabled: Set[str] = set()
        
        # Track user IDs for each conversation (for analytics/logging purposes)
        self.conversation_users: Dict[str, Set[int]] = defaultdict(set)
        
    def get_conversation_id(self, chat_id: int, message_thread_id: Optional[int] = None) -> str:
        """
        Generate a unique conversation ID based on the chat context.
        
        Args:
            chat_id: The Telegram chat ID
            message_thread_id: The thread ID if the message is in a thread
            
        Returns:
            A string identifier for the conversation
        """
        if message_thread_id:
            # If it's a thread, use both chat_id and thread_id
            return f"{chat_id}_{message_thread_id}"
        # Otherwise just use chat_id
        return str(chat_id)
    
    def add_message(self, conversation_id: str, role: str, content: str, user_id: Optional[int] = None) -> None:
        """
        Add a message to the conversation history.
        
        Args:
            conversation_id: The unique conversation identifier
            role: Either "user" or "assistant"
            content: The message content
            user_id: The ID of the user who sent this message (if applicable)
        """
        self.conversations[conversation_id].append({
            "role": role,
            "content": content
        })
        
        # If user_id is provided, track this user in the conversation
        if user_id and role == "user":
            self.conversation_users[conversation_id].add(user_id)
        
        logger.debug(f"Added {role} message to conversation {conversation_id}. Current history length: {len(self.conversations[conversation_id])}")
    
    def get_conversation_history(self, conversation_id: str) -> List[Dict[str, str]]:
        """
        Get the current conversation history.
        
        Args:
            conversation_id: The unique conversation identifier
            
        Returns:
            List of message dictionaries in the format [{"role": "...", "content": "..."}]
        """
        return list(self.conversations[conversation_id])
    
    def reset_conversation(self, conversation_id: str) -> None:
        """
        Clear the conversation history.
        
        Args:
            conversation_id: The unique conversation identifier
        """
        if conversation_id in self.conversations:
            self.conversations[conversation_id].clear()
            logger.info(f"Reset conversation history for {conversation_id}")
    
    def enable_auto_reply(self, conversation_id: str) -> None:
        """
        Enable auto-reply mode for a conversation.
        
        Args:
            conversation_id: The unique conversation identifier
        """
        self.auto_reply_enabled.add(conversation_id)
        logger.info(f"Auto-reply enabled for conversation {conversation_id}")
    
    def disable_auto_reply(self, conversation_id: str) -> None:
        """
        Disable auto-reply mode for a conversation.
        
        Args:
            conversation_id: The unique conversation identifier
        """
        self.auto_reply_enabled.discard(conversation_id)
        logger.info(f"Auto-reply disabled for conversation {conversation_id}")
    
    def is_auto_reply_enabled(self, conversation_id: str) -> bool:
        """
        Check if auto-reply is enabled for a conversation.
        
        Args:
            conversation_id: The unique conversation identifier
            
        Returns:
            Boolean indicating whether auto-reply is enabled
        """
        return conversation_id in self.auto_reply_enabled
