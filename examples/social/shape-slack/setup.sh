#!/bin/bash
python -m venv venv
source venv/bin/activate
pip install .

echo "Setup complete."
echo "Activate the virtual environment with 'source venv/bin/activate'"
echo "Copy .env.example to .env and add your API keys"
echo "Run main.py to test Shapes API."
