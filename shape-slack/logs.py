# logs.py
from flask import render_template_string, request
import os

# Generate a random secure token if none is provided in environment variables
DEFAULT_SECRET = "secret-pwd"
LOGS_SECRET = os.environ.get("LOGS_SECRET", DEFAULT_SECRET)
LOGS_LINES = int(os.environ.get("LOGS_LINES", 100))


def view_logs():
    # Debug - print what's being received

    # Check if this is a POST request with the correct secret
    if request.method != "POST" or request.form.get("logs_secret") != LOGS_SECRET:
        # If not authenticated, show login form instead of logs
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Log Authentication</title>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    background-color: #f5f5f5;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
                .login-container {
                    background-color: white;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    width: 350px;
                }
                h2 {
                    margin-top: 0;
                    color: #333;
                }
                form {
                    display: flex;
                    flex-direction: column;
                }
                input[type="password"] {
                    padding: 10px;
                    margin: 10px 0;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                button {
                    padding: 10px;
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 10px;
                }
                button:hover {
                    background-color: #45a049;
                }
            </style>
        </head>
        <body>
            <div class="login-container">
                <h2>Log Access</h2>
                <form method="POST" action="/logs">
                    <input type="password" name="logs_secret" placeholder="Enter logs secret" required>
                    <button type="submit">View Logs</button>
                </form>
            </div>
        </body>
        </html>
        """
        return render_template_string(html_template)

    # If authenticated, show logs
    log_path = "/app/logs/log.txt"
    last_lines = []

    # Check if log file exists
    if os.path.exists(log_path):
        try:
            # Read the last N lines
            with open(log_path, "r") as file:
                # Load all lines and get the last N lines
                all_lines = file.readlines()
                last_lines = (
                    all_lines[-LOGS_LINES:]
                    if len(all_lines) > LOGS_LINES
                    else all_lines
                )
        except Exception as e:
            error_msg = f"Error reading log file: {str(e)}"
            print(error_msg)
            last_lines = [error_msg]
    else:
        last_lines = ["Log file does not exist yet"]
        print("Log file not found at:", log_path)

    # Create a simple HTML template to display the logs with the form to resubmit
    html_template = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Application Logs</title>
        <meta http-equiv="refresh" content="60"> <!-- Auto-refresh every 60 seconds -->
        <style>
            body {
                font-family: monospace;
                background-color: #f5f5f5;
                padding: 20px;
            }
            h1 {
                color: #333;
            }
            .log-container {
                background-color: #222;
                color: #f0f0f0;
                padding: 15px;
                border-radius: 5px;
                max-height: 80vh;
                overflow-y: auto;
                white-space: pre-wrap;
            }
            .log-entry {
                margin: 0;
                padding: 2px 0;
                border-bottom: 1px solid #444;
            }
            .hidden-form {
                display: none;
            }
        </style>
    </head>
    <body>
        <h1>Last {{ LOGS_LINES }} Log Lines</h1>
        <!-- Hidden form for auto-refresh with authentication -->
        <form id="auth-form" class="hidden-form" method="POST" action="/logs">
            <input type="hidden" name="logs_secret" value="{{ secret }}">
        </form>
        <div class="log-container">
            {% for line in log_lines %}
            <div class="log-entry">{{ line }}</div>
            {% endfor %}
        </div>
        <script>
            // Submit the form on refresh to maintain authentication
            window.onload = function() {
                // Auto-submit is handled by meta refresh, but we need this for manual refresh
                window.addEventListener('focus', function() {
                    document.getElementById('auth-form').submit();
                });
            };
        </script>
    </body>
    </html>
    """

    return render_template_string(
        html_template,
        log_lines=last_lines,
        secret=request.form.get("logs_secret"),
        LOGS_LINES=LOGS_LINES,
    )
