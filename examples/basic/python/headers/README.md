# Advanced Python examples for the Shapes API

## Prerequisites

- Python 3.8+
- pip
- virtualenv

## Setup

```bash
./setup.sh
```

This will create a virtual environment and install the required dependencies.

## Usage

Copy the `.env.example` file to `.env` and add your API keys.

```bash
source venv/bin/activate
python main.py [--user-id USER_ID] [--channel-id CHANNEL_ID] [message]
```

### Command Line Arguments

- `--user-id`: Identifies the end user making the request. If not provided, all requests will be attributed to the API key owner.
- `--channel-id`: Identifies the specific channel or conversation context. Without this, the shape will treat all messages as coming from a single unified channel.
- `message`: The message to send to the shape. If not provided, a default greeting will be used.

### Examples

```bash
# Basic usage with a message
python main.py Hello, how are you today?

# With user and channel IDs
python main.py --user-id user123 --channel-id channel456 Tell me about yourself

# Just specifying IDs with default message
python main.py --user-id user123 --channel-id channel456
```

------------------
© 2025 Shapes Inc.
