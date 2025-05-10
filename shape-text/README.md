# Shape-Text

A Python library for integrating [Shapes API](https://github.com/shapesinc/api) into text messaging applications using Twilio.

## Overview

Shape-Text enables developers to create immersive conversational experiences by connecting real personalities from the Shapes network to text messaging interfaces. It provides a simple way to build SMS-based connections that let users interact with the diverse personalities available through Shapes.

## Features

- SMS integration via Twilio
- Support for individual and group conversations
- Easy configuration for different Shapes personalities
- Persistent user conversations
- Switchboard operator to help users connect with their preferred personality
- Optional Redis integration for persistent storage across restarts

## Installation

```bash
# Clone the repository
git clone https://github.com/shapesinc/shape-text.git
cd shape-text

# Install dependencies using Poetry
poetry install

# For Redis support (optional)
poetry install --extras optional
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```
# Shapes API
SHAPES_API_KEY=your_shapes_api_key
SHAPES_API_URL=https://api.shapes.inc/v1
TEST_SHAPE_USERNAME=your_shape_username

# Operator configuration
OPERATOR_SHAPE_USERNAME=operator

# User identification for testing
TEST_USER_ID=test_user_id
TEST_X_CHANNEL_ID=test_channel_id

# Twilio credentials
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
USER_PHONE_NUMBER=your_user_phone_number

# Redis configuration (optional)
# Either use REDIS_URL or REDIS_HOST/PORT/PASSWORD
# REDIS_URL=redis://username:password@host:port
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=your_redis_password
```

## Usage

### Basic Example

```python
from brain import Brain

# Initialize the Brain with a specific shape personality
brain = Brain(
    shape_username="your_shape_username",
    user_id="unique_user_identifier"
)

# Generate a response
reply = brain.generate_reply(message="Hello, how are you?")
print(reply)
```

### Running the Flask Server

```bash
python main.py
```

This starts a Flask server on port 8080 that can receive SMS messages via Twilio webhooks.

## Integration with Twilio

1. Create a Twilio account and purchase a phone number
2. Configure your Twilio phone number's webhook for incoming messages to point to your server's `/sms` endpoint
3. Set your Twilio credentials in the `.env` file

## Redis Integration

Shape-Text optionally supports Redis for persistent storage of user preferences across server restarts:

1. Install Redis support: `poetry install --extras optional`
2. Configure Redis connection in your `.env` file using either:
   - `REDIS_URL`: A full Redis connection string
   - Or individual components: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
3. The application will automatically use Redis if available, or fall back to in-memory storage

Benefits of Redis integration:
- Persistent user preferences across server restarts
- Scalability across multiple instances of the application
- No changes needed to your application code

## User Experience

The application now provides a switchboard-like experience:

1. When a user first messages the system, they're greeted by the Shapes Switchboard Operator
2. The operator asks who they'd like to speak with today
3. Users can visit shapes.inc, find someone they'd like to talk to, and send their profile URL (e.g., shapes.inc/shoutingguy)
4. The system connects the user directly to that personality
5. The user's connection preference is remembered for future conversations
6. Users can change who they're speaking with at any time by sending a new shapes.inc profile URL

## License

MIT © [Shapes, Inc.](https://shapes.inc) 2025 