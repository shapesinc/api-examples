from flask import Flask, render_template_string
import logging
import os
import psutil
import subprocess
import threading
import time

# Set up logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Global flags
bot_started = False

@app.route('/')
def index():
    """Simple status page"""
    # Check if the bot is running
    bot_status = "Running" if check_bot_is_running() else "Not Running"
    
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Telegram Bot Status</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
                color: #333;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                background-color: white;
                padding: 20px;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            h1 {
                color: #0088cc;
            }
            .status {
                padding: 10px 15px;
                background-color: #d4edda;
                color: #155724;
                border-radius: 3px;
                margin: 15px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Telegram Bot Status</h1>
            <div class="status">
                <p><strong>Bot Status: """ + bot_status + """</strong></p>
                <p>The Telegram bot can be accessed via Telegram.</p>
            </div>
            <p>This web interface exists only to satisfy Replit deployment requirements.</p>
            <p>The actual functionality is provided by the Telegram bot.</p>
        </div>
    </body>
    </html>
    """
    return render_template_string(html)

def check_bot_is_running():
    """Check if any python process is running with main.py in its cmdline"""
    for proc in psutil.process_iter(['cmdline']):
        try:
            if proc.info and proc.info['cmdline']:
                cmdline = ' '.join(proc.info['cmdline'])
                if 'python' in cmdline and 'main.py' in cmdline:
                    return True
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return False

# Function to run with waitress for production
def run_waitress():
    from waitress import serve
    serve(app, host='0.0.0.0', port=5000)

if __name__ == '__main__':
    # Run the Flask app with waitress
    logger.info("Starting web server on port 5000...")
    run_waitress()