# Shape Mail Service

Open source implementation of the shape mail service that handles inbound emails and automatically generates replies using the Shapes API. This production service by Shapes, Inc. demonstrates how to integrate with the Shapes API to create shape-driven email responses.

## Table of Contents
- [Overview](#overview)
- [How Shape Usernames Work](#how-shape-usernames-work)
- [Architecture](#architecture)
- [Important: Development Use Only](#important-development-use-only)
- [Shapes API Capabilities](#shapes-api-capabilities)
- [Setup Guide](#setup-guide)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Mailgun Setup](#mailgun-setup)
  - [Running the Service](#running-the-service)
- [Testing](#testing)
- [Extensions and Use Cases](#extensions-and-use-cases)
- [Contributing](#contributing)
- [Dependencies](#dependencies)
- [License](#license)

## Overview

This service allows you to create email-based interactions with shapes from Shapes, Inc. When an email is received by a specific shape's address (e.g., `bluey1@shapes.inc`), the system:

1. Processes the incoming email
2. Extracts the relevant information including the shape username from the email address
3. Sends the content to the Shapes API with the appropriate shape identifier
4. Generates a personalized response in the shape's voice
5. Sends the reply back to the original sender with proper email threading

## How Shape Usernames Work

Each shape on Shapes, Inc has a unique username that identifies it. For example:
- `bluey1` in the URL `https://shapes.inc/bluey1`
- `tenshi` in the URL `https://shapes.inc/tenshi`

This service automatically extracts the shape username from the email address that receives the message. For example:
- Email sent to `bluey1@shapes.inc` → Uses the shape `bluey1`
- Email sent to `tenshi@shapes.inc` → Uses the shape `tenshi`

The system then uses this username to call the Shapes API with the appropriate model identifier:
```python
model=f"shapesinc/{shape_username}"
```

This design makes it easy to add support for any shape available on Shapes, Inc without code changes.

### Try It Now!

You can try this service right now by sending an email to any shape at `@shapes.inc`. For example:
- Email `bluey1@shapes.inc` to interact with Bluey
- Email `tenshi@shapes.inc` to interact with Tenshi

Just send an email to your favorite shape, and they'll reply back to you automatically!

## Architecture

```
┌─────────┐    ┌───────────┐    ┌─────────────┐    ┌──────────┐    ┌──────────┐
│ Mailgun │───>│  Webhook  │───>│ MailDriver  │───>│ Shape API│───>│ Outbound │
└─────────┘    └───────────┘    └─────────────┘    └──────────┘    └──────────┘
                    │                  │                                 │
                    │                  │                                 │
                    └──────────────────┴─────────────────────────┬──────┘
                                                                 │
                                                          ┌──────────────┐
                                                          │ Email Reply  │
                                                          └──────────────┘
```

The service provides:
- Webhook handling for incoming emails via Mailgun
- Processing and formatting of email content
- Integration with the Shapes API for shape-generated responses
- Proper email threading and reply formatting
- CC list handling

## Important: Development Use Only

This integration is currently intended for **development purposes only** if you're creating your own deployment. The code showcased here is already running in production at Shapes, Inc. Please note:

- All API calls are tied to your user account - the shape will always think it's talking to you
- For configuring AI and other shape settings, you must go to [shapes.inc](https://shapes.inc)
- To obtain your Shapes API key for development, email [hi@shapes.inc](mailto:hi@shapes.inc)

**Coming Soon:**
- Authorization with shapes.inc
- X-User-ID provision for multi-user access
- Production-ready integrations

## Shapes API Capabilities

The Shapes API already includes powerful features that you can leverage:

- **Short-Term Memory (STM)**: Shapes remember recent conversations
- **Long-Term Memory (LTM)**: Shapes maintain persistent memory about interactions
- **Personality Management**: Access to shapes with consistent personalities
- **Knowledge Integration**: Shapes use their built-in knowledge
- **Advanced Customization**: All settings configured through shapes.inc are automatically applied

For a complete overview of Shapes features, visit the [Shapes Wiki](https://wiki.shapes.inc).

## Setup Guide

### Prerequisites

Before you begin, you'll need:

1. A [Mailgun](https://www.mailgun.com/) account
2. A domain configured with Mailgun
3. A Shapes API key (email [hi@shapes.inc](mailto:hi@shapes.inc) to request one)
4. Python 3.8+ installed on your system

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/shape-mail.git
   cd shape-mail
   ```

2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv nenv
   source nenv/bin/activate  # On Windows: nenv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Configuration

1. Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your specific configuration:
   ```
   # Mailgun Configuration
   MAILGUN_API_KEY=your_mailgun_api_key_here
   MAILGUN_API_URL=https://api.mailgun.net/v3/your_domain/messages
   MAILGUN_WEBHOOK_PATH=/webhook/mailgun
   
   # Shapes API Configuration
   SHAPES_API_KEY=your_shapes_api_key_here
   SHAPES_API_URL=https://api.shapes.inc/v1
   
   # Optional: Sentry Configuration
   # SENTRY_DSN=your_sentry_dsn_here
   
   # Testing Configuration
   TEST_SHAPE_USERNAME=your_test_shape_username
   ```

### Mailgun Setup

#### Step 1: Domain Configuration
1. Sign up for a [Mailgun account](https://signup.mailgun.com/new/signup)
2. Add and verify your domain in the Mailgun dashboard
3. Complete DNS verification by adding the required DNS records to your domain

#### Step 2: API Key
1. Go to the Mailgun dashboard
2. Navigate to "API Security" or "API Keys"
3. Copy your Private API Key

#### Step 3: Configure Receiving Routes
1. In the Mailgun dashboard, go to "Receiving" > "Create Route"
2. Set up a catch-all route:
   - **Expression Type**: Match Recipient
   - **Recipient**: `.*@shapes.inc` (catch-all pattern)
   - **Actions**: Forward to your webhook URL
   
   Example webhook URL: `https://your-server.com/webhook/mailgun`

   If testing locally, use ngrok to create a temporary public URL:
   ```bash
   ngrok http 8080
   ```
   Then use the ngrok URL + your webhook path as the forwarding address.

#### Step 4: Email Address Configuration
For each shape you want to use, you have two options:

1. **Individual Email Addresses**: 
   Create specific routes for each shape: `bluey1@shapes.inc`, `tenshi@shapes.inc`, etc.

2. **Catch-All Configuration**:
   Set up a wildcard route to catch all emails sent to any address at your domain.
   This automatically routes to the correct shape based on the username in the email address.

### Running the Service

1. Start the Flask server:
   ```bash
   python main.py
   ```

2. The service will run on `0.0.0.0:8080` by default

3. Send a test email to `yourshape@shapes.inc` to verify it's working

## Testing

### Local Testing

1. Run the test script to verify email sending functionality:
   ```bash
   python tests.py
   ```

2. For webhook testing with Mailgun, use [ngrok](https://ngrok.com/) to expose your local server:
   ```bash
   ngrok http 8080
   ```

3. Update your Mailgun webhook URL to point to your ngrok URL + webhook path

### Troubleshooting

Common issues and solutions:

- **Webhook not receiving emails**: Verify your Mailgun route configuration
- **No response from shape**: Check your Shapes API key and shape username
- **Email not sending**: Verify Mailgun API key and domain verification status

## Extensions and Use Cases

This code serves as a powerful starting point that you can extend in many ways:

### Build Your Own Clone

1. **Custom Domains**: Set up your own domain and configure Mailgun to handle emails for all shapes
2. **Additional Email Providers**: Extend beyond Mailgun by implementing drivers for SendGrid, AWS SES, etc.
3. **Self-Hosting**: Deploy on your own server or cloud platform for full control

### Fun Use Cases

1. **Shape-Based Customer Service**: Let shapes handle customer inquiries with their unique personalities
2. **Character-Based Newsletters**: Send periodic emails from shapes to subscribers
3. **Interactive Storytelling**: Create email-based adventures where users exchange messages with shapes
4. **Educational Applications**: Set up shapes as tutors or learning companions who correspond via email
5. **Social Networks**: Build a system where users can exchange emails with multiple shapes in a cohesive storyline

## Dependencies

- `flask`: Web framework for handling HTTP requests
- `requests`: HTTP client for API calls
- `openai`: Client for interacting with the Shapes API (OpenAI compatible)
- `python-dotenv`: For loading environment variables
- `sentry-sdk[flask]` (optional): Error tracking

## Contributing

We welcome contributions to the Shape Mail Service! Here's how you can help:

1. Check out the [open issues](https://github.com/shapesinc/shape-mail/issues) for ways to contribute
2. Fork the repository
3. Create a new branch for your feature or bugfix
4. Make your changes
5. Submit a pull request

Please read our [Contributing Guide](CONTRIBUTING.md) for more details on:
- Setting up your development environment
- Coding standards
- The pull request process
- Issue reporting

We've also provided templates for:
- Bug reports
- Feature requests
- Pull requests
- Documentation improvements

## License

MIT License - Copyright (c) 2025 Shapes, Inc. See the [LICENSE](LICENSE) file for details.