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

    def generate_reply(self, og_body: str) -> str:
        """
        Generate a reply to an email using the Shapes API.

        This method takes the original email body and subject, and generates
        a response using the specified shape's personality and style.

        Args:
            og_body (str): The original email body text to respond to
            subject (str, optional): The subject of the email. Defaults to empty string.

        Returns:
            str: The generated reply text
        """
        # Create the user message with instructions for the shape
        user_message = (
            "[Note: The user has emailed you and your task is to write a thoughtful"
            " and engaging email back to the User. Your reply should be engaging "
            "for the user to pay attention to and read it. and also to reply back to it."
            " Don't add Subject and address user by name.]"
        )

        # Check if there are attachments in the body
        if "--- ATTACHMENT:" in og_body:
            user_message += (
                "\n\n[Note: The email contains attachments. The content of these attachments"
                " has been included below, enclosed between markers. Please incorporate this"
                " information into your understanding and response as appropriate.]"
            )

        user_message += f"\n\nHere is the email:\n{og_body}"

        # Generate shape reply using the appropriate model
        response = self.aclient.chat.completions.create(
            model=f"shapesinc/{self.shape_username}",
            messages=[
                {
                    "role": "user",
                    "content": user_message,
                },  # only the last user role message is processed
            ],
            extra_headers={
                "X-User-Id": f"{self.user_id}",  # If not provided, all requests will be attributed to
                # the user who owns the API key. This will cause unexpected behavior if you are using the same API
                # key for multiple users. For production use cases, either provide this header or obtain a
                # user-specific API key for each user.
            },
        )
        email_reply = response.choices[0].message.content.strip()

        # return the reply
        return email_reply


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
        user_id="testing@exampledomain.com",  # Replace with actual user ID
    )
    logging.info("Brain initialized")
    logging.info("Generating reply")
    reply = brain.generate_reply(
        og_body=f"""Hi {brain.shape_username} — What's going on with u? How's life?

Looking forward to hearing back from u :))))))))

Anushk"""
    )
    logging.info(f"Reply: {reply}")
