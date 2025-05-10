"""
MIT License

Copyright (c) 2025 Shapes, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"""

import os
import re
import logging
import requests
import tempfile
import subprocess
from urllib.parse import urlparse
from flask import Flask, request
from twilio.twiml.messaging_response import MessagingResponse
from twilio.rest import Client
from brain import Brain
from dotenv import load_dotenv

# Try to import Redis, which is optional
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# In-memory store for user shape selections
# Key: user_id or channel_id, Value: shape_username
user_shape_mapping = {}

# Track if operator message was already sent to a user/group
# Key: user_id or channel_id, Value: boolean
operator_msg_sent = {}

# Default operator shape username
OPERATOR_SHAPE = os.environ.get("OPERATOR_SHAPE_USERNAME", "operator")

# Initialize Redis client if available and configured
redis_client = None
if REDIS_AVAILABLE:
    redis_url = os.environ.get("REDIS_URL")
    redis_host = os.environ.get("REDIS_HOST")
    redis_port = os.environ.get("REDIS_PORT", 6379)
    redis_username = os.environ.get("REDIS_USERNAME")
    redis_password = os.environ.get("REDIS_PASSWORD")
    
    if redis_url:
        try:
            redis_client = redis.from_url(redis_url)
            redis_client.ping()  # Test connection
            logger.info("Connected to Redis using URL")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis using URL: {str(e)}")
            redis_client = None
    elif redis_host:
        try:
            redis_client = redis.Redis(
                host=redis_host,
                port=int(redis_port),
                username=redis_username,
                password=redis_password,
                decode_responses=True,
                socket_connect_timeout=3,
            )
            redis_client.ping()  # Test connection
            logger.info(f"Connected to Redis at {redis_host}:{redis_port}")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis at {redis_host}:{redis_port}: {str(e)}")
            redis_client = None


def get_shape_username(chat_id):
    """
    Get the shape username for a chat ID, from Redis if available or fallback to memory.
    
    Args:
        chat_id (str): The chat ID (user_id or channel_id)
        
    Returns:
        str or None: The shape username or None if not found
    """
    if redis_client:
        try:
            # Try to get from Redis using 'shape:' prefix
            redis_key = f"shape-text:{chat_id}"
            shape = redis_client.get(redis_key)
            if shape:
                return shape
        except Exception as e:
            logger.warning(f"Redis error when getting shape for {chat_id}: {str(e)}")
    
    # Fallback to in-memory dictionary
    return user_shape_mapping.get(chat_id)


def set_shape_username(chat_id, shape_username):
    """
    Set the shape username for a chat ID, in Redis if available and in memory.
    
    Args:
        chat_id (str): The chat ID (user_id or channel_id)
        shape_username (str): The shape username to set
    """
    # Always update the in-memory dictionary for fallback
    user_shape_mapping[chat_id] = shape_username
    
    # Update Redis if available
    if redis_client:
        try:
            # Store in Redis using 'shape:' prefix
            redis_key = f"shape-text:{chat_id}"
            redis_client.set(redis_key, shape_username)
        except Exception as e:
            logger.warning(f"Redis error when setting shape for {chat_id}: {str(e)}")


def get_operator_msg_sent(chat_id):
    """
    Check if operator message was sent for a chat ID, from Redis if available
    or fallback to memory.
    
    Args:
        chat_id (str): The chat ID (user_id or channel_id)
        
    Returns:
        bool: True if operator message was sent, False otherwise
    """
    if redis_client:
        try:
            # Try to get from Redis using 'operator_msg:' prefix
            redis_key = f"operator_msg:{chat_id}"
            value = redis_client.get(redis_key)
            if value is not None:
                return value == "1"
        except Exception as e:
            logger.warning(f"Redis error when getting operator_msg for {chat_id}: {str(e)}")
    
    # Fallback to in-memory dictionary
    return operator_msg_sent.get(chat_id, False)


def set_operator_msg_sent(chat_id, sent=True):
    """
    Set if operator message was sent for a chat ID, in Redis if available and in memory.
    
    Args:
        chat_id (str): The chat ID (user_id or channel_id)
        sent (bool): Whether the operator message was sent
    """
    # Always update the in-memory dictionary for fallback
    operator_msg_sent[chat_id] = sent
    
    # Update Redis if available
    if redis_client:
        try:
            # Store in Redis using 'operator_msg:' prefix
            redis_key = f"operator_msg:{chat_id}"
            redis_client.set(redis_key, "1" if sent else "0")
        except Exception as e:
            logger.warning(f"Redis error when setting operator_msg for {chat_id}: {str(e)}")


def extract_shape_username(message):
    """
    Extract shape username from a shapes.inc URL.
    
    Supports formats:
    - shapes.inc/shoutingguy
    - shapes.inc/shoutingguy/chat
    
    Args:
        message (str): The message containing the URL
        
    Returns:
        str or None: The extracted shape username or None if not found
    """
    # Match shapes.inc/{username} or shapes.inc/{username}/anything
    pattern = r'shapes\.inc/([a-zA-Z0-9_-]+)(?:/\w*)?'
    match = re.search(pattern, message)
    if match:
        return match.group(1)
    return None


@app.route("/imsg", methods=["GET", "POST"])
def imsg_reply():
    """
    Respond to incoming iMessages from Sendblue with a reply from a Shapes character.

    This endpoint receives messages from Sendblue's webhook, processes them through
    the Shapes API, and returns a response.
    """
    try:
        # Parse JSON data from Sendblue webhook
        data = request.get_json()
        
        # Extract incoming message and user identifier
        incoming_msg = data["content"]
        user_num = data["from_number"]
        to_number = data["to_number"]

        if not incoming_msg:
            logger.info("Empty message received")
            return {"status": "success"}
        
        # Log the incoming message
        logger.info(f"Received message from {user_num}: {incoming_msg[:50]}...")
        
        # Skip processing if this is an outbound message (sent by us)
        if data.get("is_outbound", False):
            logger.info("Skipping outbound message")
            return {"status": "success"}
        
        # Determine if this is a group chat
        group_id = data.get("group_id", "")
        
        # Use group_id if available, otherwise use user_num
        chat_id = group_id if group_id else user_num
        
        # Check if user/group has already selected a shape
        shape_username = get_shape_username(chat_id)
        
        # Extract shape username from message if it contains a shapes.inc URL
        extracted_username = extract_shape_username(incoming_msg)
        if extracted_username:
            shape_username = extracted_username
            set_shape_username(chat_id, shape_username)
            set_operator_msg_sent(chat_id, False)  # Reset operator message flag
            logger.info(f"Set shape for {chat_id} to {shape_username}")
            
            # Response message for shape selection
            response_msg = f"Connecting you with {shape_username} now... You're all set! {shape_username} is now on the line and ready to chat with you."
            
            # Send the response via Sendblue
            send_imessage(user_num, response_msg, group_id)
            
            # Return acknowledgment to webhook
            return {"status": "success"}
            
        # If no shape is selected, check if operator message was already sent
        if not shape_username:
            if get_operator_msg_sent(chat_id):
                # Auto-connect to operator if operator message was already sent
                shape_username = OPERATOR_SHAPE
                set_shape_username(chat_id, shape_username)
                
                # Let user know they're now connected to the operator
                connection_msg = f"You are now connected to {shape_username}."
                send_imessage(user_num, connection_msg, group_id)
                
                logger.info(f"Auto-connected {chat_id} to {shape_username} and sent response")
                return {"status": "success"}
            else:
                # Use default operator for the first message
                shape_username = OPERATOR_SHAPE
                
                # Create Brain with operator
                brain = Brain(
                    shape_username=shape_username,
                    user_id=user_num,
                )
                
                # Generate operator message
                operator_msg = "Hello, Shapes Switchboard here! I'll connect you with a Shape now. Who would you like to speak with today? Just visit https://shapes.inc to browse our directory, then send me their profile link (like https://shapes.inc/tenshi) and I'll connect you right away."
                
                # Send the operator message via Sendblue
                send_imessage(user_num, operator_msg, group_id)
                
                # Mark that operator message was sent
                set_operator_msg_sent(chat_id, True)
                
                # Return acknowledgment to webhook
                return {"status": "success"}
        
        # For direct messages (not groups), send typing indicator
        # Typing indicators are only supported for direct messages
        if not group_id:
            send_typing_indicator(user_num)
            
        # Generate reply using Brain with selected shape
        brain = Brain(
            shape_username=shape_username,
            user_id=user_num,
        )
        
        reply = brain.generate_reply(
            message=incoming_msg,
            x_channel_id=group_id,
        )
        
        # Send the response via Sendblue
        send_imessage(user_num, reply, group_id)
        
        logger.info(f"Sent response from {shape_username} to {user_num}")
        
        # Return acknowledgment to webhook
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Error processing iMessage: {str(e)}")
        # Return an error response
        return {"status": "error", "message": str(e)}, 500


@app.route("/sms", methods=["GET", "POST"])
def sms_reply():
    """
    Respond to incoming SMS messages with a reply from a Shapes character.
    
    This endpoint receives SMS messages from Twilio, processes them through
    the Shapes API, and returns a response.
    """
    try:
        # Extract incoming message and user identifier
        incoming_msg = request.values["Body"]
        user_num = request.values["From"]
        
        logger.info(f"Received message from {user_num}")
        
        # Determine if this is a group chat
        group_id = request.values.get("GroupSid", None)
        
        # Use group_id if available, otherwise use user_num
        chat_id = group_id if group_id else user_num
        
        # Check if user/group has already selected a shape
        shape_username = get_shape_username(chat_id)
        
        # Extract shape username from message if it contains a shapes.inc URL
        extracted_username = extract_shape_username(incoming_msg)
        if extracted_username:
            shape_username = extracted_username
            set_shape_username(chat_id, shape_username)
            set_operator_msg_sent(chat_id, False)  # Reset operator message flag
            logger.info(f"Set shape for {chat_id} to {shape_username}")
            
            # Create Twilio response confirming shape selection
            resp = MessagingResponse()
            resp.message(f"Connecting you with {shape_username} now... You're all set! {shape_username} is now on the line and ready to chat with you.")
            return str(resp)
            
        # If no shape is selected, check if operator message was already sent
        if not shape_username:
            if get_operator_msg_sent(chat_id):
                # Auto-connect to operator if operator message was already sent
                shape_username = OPERATOR_SHAPE
                set_shape_username(chat_id, shape_username)
                
                # Create Brain with operator
                brain = Brain(
                    shape_username=shape_username,
                    user_id=user_num,
                )
                
                # Generate reply from the operator
                reply = brain.generate_reply(
                    message=incoming_msg,
                    x_channel_id=group_id,
                )
                
                # Create Twilio response with connection notice and reply
                resp = MessagingResponse()
                resp.message(f"You are now connected to {shape_username}.\n\n{reply}")
                
                logger.info(f"Auto-connected {chat_id} to {shape_username} and sent response")
                return str(resp)
            else:
                # Use default operator for the first message
                shape_username = OPERATOR_SHAPE
                
                # Create Brain with operator
                brain = Brain(
                    shape_username=shape_username,
                    user_id=user_num,
                )
                
                # Generate operator message
                operator_msg = "Hello, Shapes Switchboard here! I'll connect you with a Shape now. Who would you like to speak with today? Just visit shapes.inc to browse our directory, then send me their profile link (like shapes.inc/shoutingguy) and I'll connect you right away."
                
                # Create Twilio response
                resp = MessagingResponse()
                resp.message(operator_msg)
                
                # Mark that operator message was sent
                set_operator_msg_sent(chat_id, True)
                
                logger.info(f"Sent operator message to {user_num}")
                return str(resp)
            
        # Generate reply using Brain with selected shape
        brain = Brain(
            shape_username=shape_username,
            user_id=user_num,
        )
        
        reply = brain.generate_reply(
            message=incoming_msg,
            x_channel_id=group_id,
        )
        
        # Create Twilio response
        resp = MessagingResponse()
        resp.message(reply)
        
        logger.info(f"Sent response from {shape_username} to {user_num}")
        return str(resp)
        
    except Exception as e:
        logger.error(f"Error processing SMS: {str(e)}")
        # Return a generic error message
        resp = MessagingResponse()
        resp.message("Sorry, I'm having trouble processing your message right now.")
        return str(resp)


def send_message(to, body):
    """
    Send an outgoing SMS message using Twilio.
    
    Args:
        to (str): The recipient's phone number
        body (str): The message content
    
    Returns:
        str: The Twilio message SID
    """
    try:
        # Get Twilio credentials from environment
        account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
        auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
        from_number = os.environ.get("TWILIO_PHONE_NUMBER")
        
        # Initialize Twilio client
        client = Client(account_sid, auth_token)
        
        # Send message
        message = client.messages.create(
            body=body,
            from_=from_number,
            to=to
        )
        
        logger.info(f"Sent message to {to} (SID: {message.sid})")
        return message.sid
        
    except Exception as e:
        logger.error(f"Error sending message: {str(e)}")
        raise


def send_imessage(to, body, group_id=None):
    """
    Send an outgoing iMessage using Sendblue.
    
    Args:
        to (str): The recipient's phone number (or list of numbers for new groups)
        body (str): The message content
        group_id (str, optional): The group ID for existing group messages
        
    Returns:
        dict: The Sendblue API response
    """
    try:
        # Get Sendblue credentials from environment
        api_key_id = os.environ.get("SENDBLUE_API_KEY_ID")
        api_secret_key = os.environ.get("SENDBLUE_API_SECRET_KEY")
        from_number = os.environ.get("SENDBLUE_PHONE_NUMBER")
        
        if not api_key_id or not api_secret_key or not from_number:
            logger.error("Sendblue credentials not found in environment variables")
            raise ValueError("Missing Sendblue credentials. Please set SENDBLUE_API_KEY_ID, SENDBLUE_API_SECRET_KEY, and SENDBLUE_PHONE_NUMBER.")
        
        headers = {
            "Content-Type": "application/json",
            "sb-api-key-id": api_key_id,
            "sb-api-secret-key": api_secret_key
        }
        
        # Check if the body contains a files.shapes.inc URL
        shapes_file_url = detect_shapes_file_url(body)
        
        # Determine if this is a group message
        is_group_message = bool(group_id)
        
        # Base payload
        payload = {"from_number": from_number}
        
        # Add recipient info
        if is_group_message:
            payload["group_id"] = group_id
            endpoint = "https://api.sendblue.co/api/send-group-message"
            logger.info(f"Preparing to send to group {group_id}")
        else:
            payload["number"] = to
            endpoint = "https://api.sendblue.co/api/send-message"
            logger.info(f"Preparing to send to {to}")
            
        if shapes_file_url:
            # Handle media file
            logger.info(f"Detected Shapes file URL: {shapes_file_url}")
            
            # Extract just the text without the URL, if any
            text_without_url = body.replace(shapes_file_url, "").strip()
            
            # Send as media with the URL
            payload["media_url"] = shapes_file_url
            
            # If there's additional text, send it as content
            if text_without_url:
                payload["content"] = text_without_url
                
            logger.info(f"Sending media from URL: {shapes_file_url}")
        else:
            # Normal text message
            payload["content"] = body
        
        # Send message via Sendblue API
        response = requests.post(
            endpoint,
            headers=headers,
            json=payload
        )
        
        # Raise exception for HTTP errors
        response.raise_for_status()
        
        return response.json()
        
    except Exception as e:
        logger.error(f"Error sending iMessage: {str(e)}")
        raise


def detect_shapes_file_url(text):
    """
    Detect if the text contains a file URL from Shapes API.
    
    Args:
        text (str): The text to check
        
    Returns:
        str or None: The file URL if found, None otherwise
    """
    # Pattern for Shapes file URLs
    pattern = r'(https://files\.shapes\.inc/[^\s]+)'
    match = re.search(pattern, text)
    if match:
        return match.group(1)
    return None


def create_group(numbers, body=None, media_url=None):
    """
    Create a new iMessage group chat using Sendblue.
    
    Args:
        numbers (list): List of phone numbers to include in the group
        body (str, optional): Initial message to send to the group
        media_url (str, optional): URL of media to send with the initial message
        
    Returns:
        str: The group_id of the newly created group
    """
    try:
        # Get Sendblue credentials from environment
        api_key_id = os.environ.get("SENDBLUE_API_KEY_ID")
        api_secret_key = os.environ.get("SENDBLUE_API_SECRET_KEY")
        from_number = os.environ.get("SENDBLUE_PHONE_NUMBER")
        
        if not api_key_id or not api_secret_key or not from_number:
            logger.error("Sendblue credentials not found in environment variables")
            raise ValueError("Missing Sendblue credentials. Please set SENDBLUE_API_KEY_ID, SENDBLUE_API_SECRET_KEY, and SENDBLUE_PHONE_NUMBER.")
            
        # Ensure we have either body or media_url
        if not body and not media_url:
            raise ValueError("Either body or media_url must be provided to create a group")
        
        headers = {
            "Content-Type": "application/json",
            "sb-api-key-id": api_key_id,
            "sb-api-secret-key": api_secret_key
        }
        
        payload = {
            "numbers": numbers,
            "from_number": from_number
        }
        
        # Add content or media_url if provided
        if body:
            payload["content"] = body
        if media_url:
            payload["media_url"] = media_url
        
        # Create group via Sendblue API
        response = requests.post(
            "https://api.sendblue.co/api/send-group-message",
            headers=headers,
            json=payload
        )
        
        # Raise exception for HTTP errors
        response.raise_for_status()
        
        # Extract group_id from response
        result = response.json()
        group_id = result.get("group_id")
        
        if not group_id:
            raise ValueError("Failed to extract group_id from Sendblue response")
            
        logger.info(f"Created group {group_id} with members {numbers}")
        return group_id
        
    except Exception as e:
        logger.error(f"Error creating group: {str(e)}")
        raise


def add_to_group(group_id, number):
    """
    Add a person to an existing iMessage group chat using Sendblue.
    
    Args:
        group_id (str): ID of the group to add the person to
        number (str): Phone number to add to the group
        
    Returns:
        dict: The Sendblue API response
    """
    try:
        # Get Sendblue credentials from environment
        api_key_id = os.environ.get("SENDBLUE_API_KEY_ID")
        api_secret_key = os.environ.get("SENDBLUE_API_SECRET_KEY")
        
        if not api_key_id or not api_secret_key:
            logger.error("Sendblue credentials not found in environment variables")
            raise ValueError("Missing Sendblue credentials. Please set SENDBLUE_API_KEY_ID and SENDBLUE_API_SECRET_KEY.")
        
        headers = {
            "Content-Type": "application/json",
            "sb-api-key-id": api_key_id,
            "sb-api-secret-key": api_secret_key
        }
        
        payload = {
            "group_id": group_id,
            "modify_type": "add_recipient",
            "number": number
        }
        
        # Add person to group via Sendblue API
        response = requests.post(
            "https://api.sendblue.co/api/modify-group",
            headers=headers,
            json=payload
        )
        
        # Raise exception for HTTP errors
        response.raise_for_status()
        
        logger.info(f"Added {number} to group {group_id}")
        return response.json()
        
    except Exception as e:
        logger.error(f"Error adding person to group: {str(e)}")
        raise


def send_typing_indicator(to):
    """
    Send a typing indicator to a recipient using Sendblue.
    
    This shows the three animated dots to indicate that someone is typing,
    which is useful for indicating that a response is being generated.
    
    Note: Only works for direct messages (not group chats) and only when
    messages have been exchanged recently.
    
    Args:
        to (str): The recipient's phone number
        
    Returns:
        dict: The Sendblue API response
    """
    try:
        # Get Sendblue credentials from environment
        api_key_id = os.environ.get("SENDBLUE_API_KEY_ID")
        api_secret_key = os.environ.get("SENDBLUE_API_SECRET_KEY")
        
        if not api_key_id or not api_secret_key:
            logger.error("Sendblue credentials not found in environment variables")
            raise ValueError("Missing Sendblue credentials. Please set SENDBLUE_API_KEY_ID and SENDBLUE_API_SECRET_KEY.")
        
        headers = {
            "Content-Type": "application/json",
            "sb-api-key-id": api_key_id,
            "sb-api-secret-key": api_secret_key
        }
        
        payload = {
            "number": to
        }
        
        # Send typing indicator via Sendblue API
        response = requests.post(
            "https://api.sendblue.co/api/send-typing-indicator",
            headers=headers,
            json=payload
        )
        
        # Raise exception for HTTP errors
        response.raise_for_status()
        
        logger.info(f"Sent typing indicator to {to}")
        return response.json()
        
    except Exception as e:
        logger.error(f"Error sending typing indicator: {str(e)}")
        # Don't raise the exception as typing indicators are optional
        return {"status": "ERROR", "error_message": str(e)}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    debug = os.environ.get("FLASK_DEBUG", "False").lower() == "true"
    
    logger.info(f"Starting server on port {port} (debug={debug})")
    app.run(debug=debug, port=port, host="0.0.0.0")
