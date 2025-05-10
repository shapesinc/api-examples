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
from flask import Flask, request
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
from mailgun_driver import MailgunDriver
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)

# Load environment variables from .env file
load_dotenv()

# Only initialize Sentry if SENTRY_DSN is provided
if os.environ.get("SENTRY_DSN"):
    sentry_sdk.init(
        dsn=os.environ.get("SENTRY_DSN"),
        # Add data like request headers and IP for users,
        # see https://docs.sentry.io/platforms/python/data-management/data-collected/ for more info
        send_default_pii=True,
        integrations=[
            FlaskIntegration(),
        ],
        # Set traces_sample_rate to 1.0 to capture 100%
        # of transactions for performance monitoring.
        # We recommend adjusting this value in production.
        traces_sample_rate=1.0,
    )
app = Flask(__name__)


@app.route("/hello/", methods=["GET", "POST"])
def welcome():
    """
    Simple health check endpoint to verify the service is running.
    Returns a "Hello World!" message.
    """
    print("Hello World!")
    return "Hello World!"


@app.route(os.environ.get("MAILGUN_WEBHOOK_PATH"), methods=["POST"])
def mailgun():
    """
    Webhook endpoint that receives POSTs from Mailgun when new emails arrive.
    The path is configurable via the MAILGUN_WEBHOOK_PATH environment variable.
    
    Processes the incoming email and generates a reply using the appropriate shape.
    
    Returns:
        str: "OK" if the email was processed successfully
    """
    return MailgunDriver().process_message(request)


if __name__ == "__main__":
    port = int(os.environ.get("PORT"))
    app.run(host="0.0.0.0", port=port)
