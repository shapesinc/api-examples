import os
import sys
import asyncio
from slack_bolt import App
from slack_bolt.adapter.flask import SlackRequestHandler
from flask import Flask, request, jsonify, request
from dotenv import load_dotenv
from openai import AsyncOpenAI

# Load environment variables
load_dotenv()

# Initialize your Slack Bolt app
app = App(
    token=os.environ.get("SLACK_BOT_TOKEN"),
    signing_secret=os.environ.get("SLACK_SIGNING_SECRET"),
)

# Initialize Flask app
flask_app = Flask(__name__)
handler = SlackRequestHandler(app)

# Initialize the Shapes API client
shapes_client = AsyncOpenAI(
    api_key=os.environ.get("SHAPESINC_API_KEY"),
    base_url="https://api.shapes.inc/v1/",
)

shape_username = os.getenv("SHAPESINC_SHAPE_USERNAME")

DEFAULT_LOGS_SECRET = "default_secret"
LOGS_SECRET = os.environ.get("LOGS_SECRET", DEFAULT_LOGS_SECRET)


# Process messages with the Shapes API
async def process_with_shapes(message_text, message_user_id, message_channel_id):
    """Process a message using the Shapes API"""
    try:
        messages = [
            {
                "role": "user",
                "content": message_text,
            }
        ]

        # Send the message to the shape. This will use the shape configured model.
        # WARNING: If the shape is premium, this will also consume credits.
        resp = await shapes_client.chat.completions.create(
            model=f"shapesinc/{shape_username}",
            messages=messages,
            extra_headers={
                "X-User-Id": message_user_id,
                "X-Channel-Id": message_channel_id,
            },
        )

        if resp.choices and len(resp.choices) > 0:
            return resp.choices[0].message.content
        else:
            print(f"No choices in response: {resp}")
            final_response = resp.choices[0].message.content
            return final_response

    except Exception as e:
        print(f"Error processing with Shapes API: {e}")
        return f"Error processing your message: {str(e)}"


# support more actions with Slack Bolt: https://github.com/slackapi/bolt-python


# Listen for message events
@app.message("")
def message_handler(message, say):
    """Handle any message in channels the bot is in"""
    print(f"Received message: {message['text']}")

    # Use asyncio to run the async function
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    # here we use shapes client to process the message
    message_user_id = f"slack-user-{message['user']}"
    message_channel_id = f"slack-channel-{message['channel']}"
    message_text = message["text"]
    response = loop.run_until_complete(
        process_with_shapes(message_text, message_user_id, message_channel_id)
    )
    loop.close()

    # Send the response back to Slack
    say(response)


# Endpoint for Slack events
@flask_app.route("/", methods=["POST"])
def slack_events():
    print(f"Received Slack event: {request.json}")
    # parse the challeneged parameter
    challenge = request.json.get("challenge")
    event_type = request.json.get("type")
    if challenge and event_type == "url_verification":
        # respond to the challenge parameter quickly
        challenge_response = jsonify({"challenge": challenge})
        return challenge_response
    return handler.handle(request)


# Health check endpoint
@flask_app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok"})


# view logs endpoint
@flask_app.route("/logs", methods=["GET", "POST"])
def logs_route():
    from logs import view_logs

    return view_logs()


def main():
    # Check for Shapes API key
    if not os.environ.get("SHAPESINC_API_KEY"):
        print("Error: SHAPESINC_API_KEY not found in environment variables")
        sys.exit(1)

    # Run the Flask app
    flask_app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 3000)))


if __name__ == "__main__":
    main()
