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

import json
import logging
import os
import io
import uuid
import time
from datetime import datetime

from helpers import extract_cc_list, format_reply_body, get_name_email_pairing
import requests
from brain import Brain
from sentry_sdk import capture_exception
from models import QualifiedEmail
import PyPDF2


class MailgunDriver:
    """
    Driver class for handling email interactions via the Mailgun API.

    This class provides methods for processing incoming emails, generating responses
    using the Shapes API, and sending replies through Mailgun. It handles all the
    email formatting, headers, and recipient management.
    """

    def __init__(self):
        """Initialize the MailgunDriver."""
        pass

    def generate_qualified_email(self, request):
        """
        Process incoming request data into a structured email object.

        This method extracts all relevant information from the Mailgun webhook request
        and creates a QualifiedEmail object that contains all necessary data for
        generating and sending a reply.

        Args:
            request: The Flask request object containing form data from Mailgun

        Returns:
            QualifiedEmail: A structured object containing all email information
        """
        # The person who sent the email, will now be the recipient receiving our outbound email
        outbound_recipient = request.form.get("from").replace('"', "")
        name_email_pair = get_name_email_pairing(outbound_recipient)[0]
        outbound_email_name = name_email_pair["name"]
        outbound_email_address = name_email_pair["email"]

        # Email id to uniquely identify the email
        message_id = request.form.get("Message-Id")

        # This is the person who received the email
        # i.e. the shape
        recipient = request.form.get("recipient")
        shape_username = recipient.split("@")[0]
        domain = recipient.split("@")[1]

        # Subject of the email
        subject = request.form.get("subject", "")
        # Body of the email
        body = request.form.get("body-plain", "")

        # Handle attachments (excluding images)
        attachment_content = ""
        attachments_json = request.form.get("attachments")
        if attachments_json:
            try:
                import json

                attachments = json.loads(attachments_json)
                for attachment in attachments:
                    attachment_name = attachment.get("name", "")
                    content_type = attachment.get("content-type", "")
                    attachment_url = attachment.get("url", "")

                    # Skip image attachments
                    if content_type.startswith("image/"):
                        continue

                    # Process text-based attachments
                    if attachment_name and content_type.startswith(
                        (
                            "text/",
                            "application/pdf",
                            "application/msword",
                            "application/vnd.openxmlformats-officedocument",
                        )
                    ):
                        try:
                            # Download the attachment content from Mailgun's storage
                            auth = ("api", os.getenv("MAILGUN_API_KEY"))
                            attachment_response = requests.get(
                                attachment_url, auth=auth
                            )

                            if attachment_response.status_code == 200:
                                # For PDF and binary files, we might need special handling
                                if content_type == "application/pdf":
                                    # Extract text from PDF if PyPDF2 is available
                                    try:
                                        # Create a file-like object from the binary content
                                        pdf_content = io.BytesIO(
                                            attachment_response.content
                                        )
                                        # Create a PDF reader object
                                        pdf_reader = PyPDF2.PdfReader(pdf_content)
                                        # Extract text from each page
                                        pdf_text = ""
                                        for page_num in range(len(pdf_reader.pages)):
                                            page = pdf_reader.pages[page_num]
                                            pdf_text += page.extract_text() + "\n\n"
                                        # Add the extracted text to the attachment content
                                        if pdf_text.strip():
                                            attachment_content += f"\n\n--- ATTACHMENT: {attachment_name} ---\n{pdf_text}\n--- END ATTACHMENT ---\n\n"
                                        else:
                                            attachment_content += f"\n\n--- ATTACHMENT: {attachment_name} ---\n[PDF contains no extractable text or contains only images]\n--- END ATTACHMENT ---\n\n"
                                    except Exception as e:
                                        logging.error(
                                            f"Error extracting text from PDF {attachment_name}: {str(e)}"
                                        )
                                        attachment_content += f"\n\n--- ATTACHMENT: {attachment_name} ---\n[Error extracting PDF text: {str(e)}]\n--- END ATTACHMENT ---\n\n"
                                else:
                                    # For text-based files, attempt to decode the content
                                    try:
                                        attachment_text = (
                                            attachment_response.content.decode(
                                                "utf-8", errors="ignore"
                                            )
                                        )
                                        attachment_content += f"\n\n--- ATTACHMENT: {attachment_name} ---\n{attachment_text}\n--- END ATTACHMENT ---\n\n"
                                    except Exception as e:
                                        attachment_content += f"\n\n--- ATTACHMENT: {attachment_name} ---\n[Content could not be decoded: {str(e)}]\n--- END ATTACHMENT ---\n\n"
                        except Exception as e:
                            logging.error(
                                f"Error downloading attachment {attachment_name}: {str(e)}"
                            )
            except Exception as e:
                logging.error(f"Error processing attachments JSON: {str(e)}")

            # Append attachment content to body if available
            if attachment_content:
                body += attachment_content

        # Process and re-order the extra recipients in the cc and to fields
        to_list = request.form.get("To", "")
        cc_list = request.form.get("Cc", "")
        # Combine all, put in cc, except email that's mine or sender's
        final_cc_list = extract_cc_list(
            to_list,  # to email list,
            cc_list,  # cc email list,
            recipient,  # my email, (will be removed)
            outbound_recipient,  # sender's email (will be removed)
        )
        # Remove empty strings
        final_cc_list = [item for item in final_cc_list if item]

        # Get email threading headers
        in_reply_to = request.form.get("In-Reply-To", "")
        references = request.form.get("References", "")

        # Initialize the qualified email object with all required fields
        qualified_email = QualifiedEmail(
            shape_username=shape_username,
            domain=domain,
            outbound_email_name=outbound_email_name,
            outbound_email_address=outbound_email_address,
            cc_list=final_cc_list,
            subject=subject,
            body=body,
            reply_body="",  # Will be set later in process_message
            message_id=message_id,
            sender_email=recipient,  # Using shape's email as sender
            in_reply_to=in_reply_to,
            references=references,
        )

        return qualified_email

    def process_message(self, request):
        """
        Process an incoming email request and generate a reply.

        This method:
        1. Extracts the email details from the request
        2. Determines which shape to use for the reply
        3. Generates a reply using the Shapes API
        4. Sends the reply back to the original sender

        Args:
            request: The Flask request object containing form data from Mailgun

        Returns:
            str: "OK" if the processing was successful
        """
        # Process incoming message into a qualified email Pydantic object
        qualified_email = self.generate_qualified_email(request)

        # FT: Ignore emails from specific senders
        # Get ignore and allow lists from environment variables
        ignore_list = os.getenv("IGNORE_LIST").split(",")
        allow_list = os.getenv("ALLOW_LIST").split(",")

        # Check if sender should be ignored (matches ignore_list but not in allow_list)
        def should_ignore_email(email):
            # If email exactly matches an allowed email, don't ignore it
            if email in allow_list:
                return False
            # Otherwise, ignore if it ends with any pattern in ignore_list
            return any(email.endswith(pattern) for pattern in ignore_list)

        # Check if outbound email should be ignored
        if should_ignore_email(qualified_email.outbound_email_address):
            return "OK"

        # Filter cc_list to remove ignored emails
        if qualified_email.cc_list:
            qualified_email.cc_list = [
                cc for cc in qualified_email.cc_list if not should_ignore_email(cc)
            ]

        # Generate the reply body using the shapes API

        body = (
            f"From:\n{qualified_email.outbound_email_name}"
            f"<{qualified_email.outbound_email_address}>"
            f"\nTo:\n{qualified_email.cc_list}"
            f"\nSubject:"
            f"\n{qualified_email.subject}"
            f"\nBody:"
            f"\n{qualified_email.body}"
        )
        reply_body = Brain(
            shape_username=qualified_email.shape_username,
            user_id=qualified_email.outbound_email_address,
        ).generate_reply(og_body=body)

        # Send the email reply
        self.send_message(
            from_email=f"{qualified_email.shape_username}@{qualified_email.domain}",
            from_name=f"{qualified_email.shape_username}",
            to_email=f"{qualified_email.outbound_email_address}",
            to_name=f"{qualified_email.outbound_email_name}",
            cc_list=qualified_email.cc_list,
            subject=f"{qualified_email.subject}",
            body=f"{qualified_email.body}",
            reply_body=f"{reply_body}",
            in_reply_to=qualified_email.in_reply_to,
            references=qualified_email.references,
            message_id=qualified_email.message_id,
        )

        return "OK"

    def send_message(
        self,
        from_email,  # the email address of the shape
        from_name,  # the name of the shape
        to_email,  # the email address of the recipient
        to_name,  # the name of the recipient
        cc_list,  # the cc list of the email
        subject,  # the subject of the email
        body,  # the original body of the email
        reply_body,  # the reply body of the email
        in_reply_to,  # the in-reply-to header of the email
        references,  # the references header of the email
        message_id,  # the message id of the email
    ):
        """
        Send an email reply via the Mailgun API.

        This method formats the email reply with proper headers for threading
        and sends it through the Mailgun API.

        Args:
            from_email (str): The email address of the shape
            from_name (str): The name of the shape
            to_email (str): The email address of the recipient
            to_name (str): The name of the recipient
            cc_list (list): List of CC recipients
            subject (str): The subject of the email
            body (str): The original body of the email
            reply_body (str): The generated reply body
            in_reply_to (str): The In-Reply-To header value
            references (str): The References header value
            message_id (str): The Message-ID header value

        Returns:
            Response: The response from the Mailgun API

        Raises:
            Exception: If the Mailgun API call fails
        """
        # Format the email body with proper reply formatting
        email_body = format_reply_body(
            to_email=to_name, original_body=body, reply_body=reply_body
        )

        # Generate a unique Message-ID for this new email
        domain = from_email.split("@")[1]
        unique_id = str(uuid.uuid4())
        new_message_id = f"<{unique_id}@{domain}>"

        # Update references to include previous message_id
        updated_references = references
        if message_id:
            if updated_references:
                updated_references = f"{updated_references} {message_id}"
            else:
                updated_references = message_id

        # Send the email via Mailgun API
        resp = requests.post(
            os.getenv("MAILGUN_API_URL"),
            auth=("api", os.getenv("MAILGUN_API_KEY")),
            data={
                "from": "{} <{}>".format(from_name, from_email),
                "to": [to_email],
                "cc": cc_list,
                "subject": subject,
                "text": email_body,
                "h:In-Reply-To": message_id,  # Use original message_id as In-Reply-To
                "h:References": updated_references,
                "h:Message-ID": new_message_id,  # Use new unique Message-ID
            },
        )

        # Log the response and handle errors
        logging.info(resp.status_code)
        logging.info(resp.headers)
        if resp.status_code != 200:
            capture_exception(Exception("mailgun failed"))
            raise Exception("mailgun failed")

        return resp

    def send_shape_email(
        self,
        shape_username,
        recipient_email,
        recipient_name="",
        cc_list=None,
        subject="",
        body="",
        generate_body=False,
        domain=None,
    ):
        """
        Send a new email from a shape to a user with custom subject, CC list, and body.

        This method allows sending emails directly from a shape without requiring
        a previous message to reply to. The body can be provided directly or
        generated by the shape's brain if generate_body is True.

        Args:
            shape_username (str): The username of the shape sending the email
            recipient_email (str): The email address of the recipient
            recipient_name (str, optional): The name of the recipient. Defaults to empty string.
            cc_list (list, optional): List of email addresses to CC. Defaults to None.
            subject (str, optional): The subject of the email. Defaults to empty string.
            body (str, optional): The body of the email. Defaults to empty string.
            generate_body (bool, optional): Whether to generate body using the shape's brain.
                                         If True, the provided body is used as context. Defaults to False.
            domain (str, optional): Email domain to use. Defaults to domain from environment variable.

        Returns:
            Response: The response from the Mailgun API

        Raises:
            Exception: If the Mailgun API call fails
        """
        # Initialize cc_list if not provided
        if cc_list is None:
            cc_list = []

        # Use default domain if not provided
        if domain is None:
            domain = os.getenv("EMAIL_DOMAIN")

        # Generate email body if requested
        if generate_body:
            # Create a minimal context for the shape
            context = (
                f"[There is no email from the user. You are sending an email to {recipient_name}."
                f" Write a friendly introduction email to the user. Make sure to make it"
                f" interesting and engaging for them to reply back. Write it in email format.]\n\n"
            )
            # Generate body using the shape's brain
            generated_body = Brain(
                shape_username=shape_username,
                user_id=recipient_email,
            ).generate_reply(og_body=context)

            email_body = generated_body
        else:
            email_body = body

        # Generate a unique Message-ID for this new email
        unique_id = str(uuid.uuid4())
        new_message_id = f"<{unique_id}@{domain}>"

        # Send the email via Mailgun API
        resp = requests.post(
            os.getenv("MAILGUN_API_URL"),
            auth=("api", os.getenv("MAILGUN_API_KEY")),
            data={
                "from": "{} <{}@{}>".format(shape_username, shape_username, domain),
                "to": [recipient_email],
                "cc": cc_list,
                "subject": subject,
                "text": email_body,
                "h:Message-ID": new_message_id,
            },
        )

        # Log the response and handle errors
        logging.info(resp.status_code)
        logging.info(resp.headers)
        if resp.status_code != 200:
            capture_exception(Exception("mailgun failed"))
            raise Exception("mailgun failed")

        return resp


if __name__ == "__main__":
    # Load environment variables from .env file
    from dotenv import load_dotenv

    load_dotenv()
    logging.basicConfig(level=logging.INFO)

    # Test sending an email from a shape
    def test_send_shape_email():
        """
        Test function to send an email from a shape to a specified recipient.
        Set the environment variables appropriately before running.
        """
        try:
            # Create an instance of MailgunDriver
            driver = MailgunDriver()

            # Get shape username from environment or use default
            shape_username = os.getenv("TEST_SHAPE_USERNAME")

            # Get test recipient email from environment or use default
            recipient_email = os.getenv("TEST_RECIPIENT_EMAIL")
            recipient_name = os.getenv("TEST_RECIPIENT_NAME")

            # Set up test email parameters
            subject = "Hello from old friend"
            body = "This is a test email from the shape."
            cc_list = []  # Add CC recipients if needed

            # Test with custom body
            # logging.info(
            #     f"Sending test email to {recipient_email} from shape {shape_username}..."
            # )
            # response = driver.send_shape_email(
            #     shape_username=shape_username,
            #     recipient_email=recipient_email,
            #     recipient_name=recipient_name,
            #     cc_list=cc_list,
            #     subject=subject,
            #     body=body,
            #     generate_body=False,  # Use custom body
            # )
            #
            # logging.info(f"Email sent successfully! Status code: {response.status_code}")

            # Test with generated body (uncomment to test)
            logging.info(f"Sending test email with generated body...")
            response = driver.send_shape_email(
                shape_username=shape_username,
                recipient_email=recipient_email,
                recipient_name=recipient_name,
                cc_list=cc_list,
                subject=subject,
                body="",
                generate_body=True,  # Generate body using shape's brain
            )
            logging.info(
                f"Email with generated body sent successfully! Status code: {response.status_code}"
            )

            return True
        except Exception as e:
            logging.info(f"Error sending test email: {str(e)}")
            return False

    # Run the test function
    success = test_send_shape_email()
    logging.info(f"Test {'successful' if success else 'failed'}")
