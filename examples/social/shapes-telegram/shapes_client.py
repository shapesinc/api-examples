import logging
import time
from typing import Dict, List, Optional

import openai
from openai import OpenAI

from config import (
    SHAPES_API_KEY,
    SHAPES_API_BASE,
    SHAPES_MODEL,
    REQUEST_TIMEOUT
)

logger = logging.getLogger(__name__)

class RateLimitExceeded(Exception):
    """Exception raised when the API rate limit is exceeded."""
    pass

class ShapesClient:
    """Client for interacting with the Shapes Inc API using OpenAI API compatibility."""
    
    def __init__(self):
        self.api_key = SHAPES_API_KEY
        self.api_base = SHAPES_API_BASE
        self.model = SHAPES_MODEL
        self.last_request_time = 0
        self.min_request_interval = 1  # Minimum time between requests in seconds
        
        # Initialize the OpenAI client with Shapes settings
        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.api_base
        )
        
        # Log some info about the configuration
        logger.info(f"Initialized Shapes client with model: {self.model}")
        
        # Check for empty API key
        if not self.api_key or self.api_key.strip() == "":
            logger.error("Shapes API key is empty or not set!")
            
        # Mask the API key for security in logs
        masked_key = "****" + self.api_key[-4:] if self.api_key and len(self.api_key) > 4 else "NOT SET"
        logger.info(f"Using Shapes API key: {masked_key}")
    
    def generate_response(self, 
                         conversation_history: List[Dict[str, str]], 
                         system_prompt: Optional[str] = None,
                         user_id: Optional[str] = None,
                         channel_id: Optional[str] = None) -> str:
        """
        Generate a response from the Shapes Inc model.
        
        Args:
            conversation_history: List of dictionaries with 'role' and 'content' keys
            system_prompt: Optional custom system prompt (ignored)
            user_id: Optional user ID for the request
            channel_id: Optional channel ID for the request
            
        Returns:
            The generated response text
            
        Raises:
            RateLimitExceeded: If the API rate limit is exceeded
            Exception: For other API errors
        """
        # Rate limiting
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time
        
        if time_since_last_request < self.min_request_interval:
            sleep_time = self.min_request_interval - time_since_last_request
            logger.debug(f"Rate limiting: Sleeping for {sleep_time:.2f} seconds")
            time.sleep(sleep_time)
        
        # Just use the conversation history without any system prompt
        messages = conversation_history
        
        logger.debug(f"Sending request to Shapes API with {len(messages)} messages")
        self.last_request_time = time.time()
        
        try:
            # Set up headers for user identification and conversation context
            headers = {}
            if user_id:
                headers["X-User-Id"] = user_id  # If not provided, all requests will be attributed to
                # the user who owns the API key. This will cause unexpected behavior if you are using the same API
                # key for multiple users. For production use cases, either provide this header or obtain a
                # user-specific API key for each user.
            
            # Only add channel ID if provided
            if channel_id:
                headers["X-Channel-Id"] = channel_id  # If not provided, all requests will be attributed to
                # the user. This will cause unexpected behavior if interacting with multiple users
                # in a group.

            # Make the request using the OpenAI client
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=1024,
                timeout=REQUEST_TIMEOUT,
                extra_headers=headers,
            )
            
            # Extract the response content
            assistant_message = response.choices[0].message.content
            
            logger.debug(f"Received response from Shapes API: {assistant_message[:50]}...")
            return assistant_message
            
        except openai.RateLimitError as e:
            logger.error(f"Rate limit exceeded: {e}")
            raise RateLimitExceeded(f"API rate limit exceeded: {e}")
            
        except openai.APIError as e:
            logger.error(f"Error calling Shapes API: {e}")
            raise Exception(f"Failed to generate response: {e}")
            
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            raise Exception(f"An unexpected error occurred: {str(e)}")