"""
MIT License

Copyright (c) 2025 Shapes, Inc

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

import logging
import os
from typing import Optional
from openai import OpenAI


class Brain:
    """
    Brain class that handles interaction with the Shapes API.

    This class provides a way to generate email replies using different shapes
    via the Shapes API, which is compatible with the OpenAI API interface.

    Each shape is identified by a username, which is used to select the appropriate
    model for generating responses.
    """

    def __init__(self, shape_username: str, user_id: str):
        """
        Initialize the Brain with a specific shape.

        Args:
            shape_username (str): The username of the shape to use for generating replies.
                                 This corresponds to the model name in the Shapes API.
        """
        self.shape_username = shape_username
        self.user_id = user_id
        self.aclient = OpenAI(
            api_key=os.getenv("SHAPES_API_KEY"),
            base_url=os.getenv("SHAPES_API_URL"),
        )

    def generate_reply(self, message: str, x_channel_id: Optional[str] = None) -> str:
        """
        Generate a reply to a text message using the Shapes API.

        This method takes the x_user_id and x_channel_id from the message, and generates
        a response using the specified shape's personality and style.

        Args:
            message (str): The original message text to respond to
            x_channel_id (str): The channel ID of the message

        Returns:
            str: The generated reply text
        """
        user_message = f"{message}"

        # Generate shape reply using the appropriate model

        # always do this
        headers = {
            "X-User-Id": f"{self.user_id}",  # If not provided, all requests will be attributed to
            # the user who owns the API key. This will cause unexpected behavior if you are using the same API
            # key for multiple users. For production use cases, either provide this header or obtain a
            # user-specific API key for each user.
        }

        # only do this if it's a channel
        if x_channel_id:
            headers[
                "X-Channel-Id"
            ] = x_channel_id  # If not provided, all requests will be attributed to
            # the user. This will cause unexpected behavior if interacting with multiple users
            # in a group.

        response = self.aclient.chat.completions.create(
            model=f"shapesinc/{self.shape_username}",
            messages=[
                {
                    "role": "user",
                    "content": user_message,
                },  # only the last user role message is processed
            ],
            extra_headers=headers,
        )
        reply = response.choices[0].message.content.strip()

        # return the reply
        return reply


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    # Load environment variables from .env file
    from dotenv import load_dotenv

    logging.info("Loading environment variables from .env file")
    load_dotenv()
    logging.info("Environment variables loaded")

    # Example usage
    brain = Brain(
        shape_username=os.getenv("TEST_SHAPE_USERNAME"),
        user_id=os.getenv("TEST_USER_ID"),
    )
    logging.info("Brain initialized")
    logging.info("Generating reply")
    x_channel_id = os.getenv("TEST_X_CHANNEL_ID")
    reply = brain.generate_reply(message="yo wasup?", x_channel_id=x_channel_id)
    logging.info(f"Reply: {reply}")
