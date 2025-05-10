# Advanced Python examples for the Shapes API

## Prerequisites

- Python 3.12+
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
python main.py --channel IRC_CHANNEL --server IRC_SERVER [--shape SHAPE_NAME]
```

### Command Line Arguments

- `--channel`: (Required) IRC channel to join (can be provided with or without the # prefix)
- `--server`: (Required) IRC server to connect to
- `--shape`: (Optional) Shape name to use as the bot's nickname. If not provided, the bot will attempt to fetch the shape name from the API
- `--port`: (Optional) IRC server port (default: 6697 for SSL)

### Examples

```bash
# Basic usage
python main.py --channel foobar --server irc.libera.chat
```

------------------
© 2025 Shapes Inc.
