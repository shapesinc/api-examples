import json
import os
import logging
from typing import List, Dict, Any, Optional

# Set up logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AccessManager:
    """Manages access control for the bot based on chat IDs."""
    
    def __init__(self, access_file: str = "approved_chats.json", admin_password: Optional[str] = None):
        """
        Initialize the access manager.
        
        Args:
            access_file: Path to the JSON file storing approved chat IDs
            admin_password: Password for approving access. If None, gets from environment variable
        """
        self.access_file = access_file
        self.admin_password = admin_password or os.environ.get("BOT_ADMIN_PASSWORD", "change-this-password")
        self.pending_approvals: Dict[int, int] = {}  # user_id -> chat_id
        self._load_approved_chats()
    
    def _load_approved_chats(self) -> None:
        """Load the list of approved chat IDs from the JSON file."""
        try:
            if os.path.exists(self.access_file):
                with open(self.access_file, 'r') as f:
                    self.approved_chats = json.load(f)
                logger.info(f"Loaded {len(self.approved_chats)} approved chat IDs")
            else:
                self.approved_chats = []
                logger.info("No approved chats file found, starting with empty list")
                self._save_approved_chats()  # Create the file
        except Exception as e:
            logger.error(f"Error loading approved chats: {str(e)}")
            self.approved_chats = []
    
    def _save_approved_chats(self) -> None:
        """Save the list of approved chat IDs to the JSON file."""
        try:
            with open(self.access_file, 'w') as f:
                json.dump(self.approved_chats, f)
            logger.info(f"Saved {len(self.approved_chats)} approved chat IDs")
        except Exception as e:
            logger.error(f"Error saving approved chats: {str(e)}")
    
    def is_chat_approved(self, chat_id: int) -> bool:
        """
        Check if a chat ID is approved.
        
        Args:
            chat_id: The chat ID to check
            
        Returns:
            Boolean indicating whether the chat is approved
        """
        return chat_id in self.approved_chats
    
    def register_pending_approval(self, user_id: int, chat_id: int) -> None:
        """
        Register a chat ID for pending approval by a user.
        
        Args:
            user_id: The user ID requesting approval
            chat_id: The chat ID to be approved
        """
        self.pending_approvals[user_id] = chat_id
        logger.info(f"Registered pending approval: user {user_id} for chat {chat_id}")
    
    def direct_approve_chat(self, chat_id: int, password: str) -> Dict[str, Any]:
        """
        Directly approve a chat ID if the password is correct.
        
        Args:
            chat_id: The chat ID to approve
            password: The admin password
            
        Returns:
            Dict with success status and message
        """
        if password != self.admin_password:
            return {
                "success": False,
                "message": "Incorrect password! Access denied. Please try again with the correct password."
            }
        
        # Check if already approved
        if chat_id in self.approved_chats:
            return {
                "success": True,
                "message": f"Chat ID {chat_id} was already approved! No changes needed."
            }
        
        # Add to approved list
        self.approved_chats.append(chat_id)
        self._save_approved_chats()
        
        return {
            "success": True,
            "message": f"Success! Chat ID {chat_id} has been approved. The bot will now respond in that chat."
        }
        
    def approve_chat(self, user_id: int, password: str) -> Dict[str, Any]:
        """
        Approve a chat ID if the password is correct.
        
        Args:
            user_id: The user ID requesting approval
            password: The admin password
            
        Returns:
            Dict with success status and message
        """
        if user_id not in self.pending_approvals:
            return {
                "success": False,
                "message": "No pending approval request found. Please use the '@botname getaccess' command in the chat you want to approve first."
            }
        
        if password != self.admin_password:
            return {
                "success": False,
                "message": "Incorrect password! Access denied. Please try again with the correct password."
            }
        
        chat_id = self.pending_approvals[user_id]
        
        # Check if already approved
        if chat_id in self.approved_chats:
            del self.pending_approvals[user_id]
            return {
                "success": True,
                "message": f"Chat ID {chat_id} was already approved! No changes needed."
            }
        
        # Add to approved list
        self.approved_chats.append(chat_id)
        self._save_approved_chats()
        
        # Remove from pending
        del self.pending_approvals[user_id]
        
        return {
            "success": True,
            "message": f"Success! Chat ID {chat_id} has been approved. The bot will now respond in that chat."
        }
    
    def revoke_access(self, chat_id: int, password: str) -> Dict[str, Any]:
        """
        Revoke access for a chat ID if the password is correct.
        
        Args:
            chat_id: The chat ID to revoke access for
            password: The admin password
            
        Returns:
            Dict with success status and message
        """
        if password != self.admin_password:
            return {
                "success": False,
                "message": "Incorrect password! Access denied. Please try again with the correct password."
            }
        
        if chat_id not in self.approved_chats:
            return {
                "success": False,
                "message": f"Chat ID {chat_id} is not in the approved list, so it can't be revoked."
            }
        
        # Remove from approved list
        self.approved_chats.remove(chat_id)
        self._save_approved_chats()
        
        return {
            "success": True,
            "message": f"Success! Access for chat ID {chat_id} has been revoked. The bot will no longer respond in that chat."
        }