from flask import Flask, render_template, request, jsonify
import os
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

SHAPES_API_KEY = os.getenv('SHAPES_API_KEY')
SHAPES_API_URL = "https://api.shapes.inc/v1/chat/completions"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/start_interview', methods=['POST'])
def start_interview():
    try:
        reset_shape_memory()
        
        if not SHAPES_API_KEY:
            return jsonify({"error": "Shapes API key not configured"}), 500
        
        system_prompt = f"""You are Carmack, a Python technical interviewer. You have the following traits:
        - Expert in Python and computer science
        - Direct and technically precise in your communication
        - Focus on practical problem-solving and code efficiency
        - Ask one question at a time and wait for the response
        - Start with fundamental concepts before moving to complex topics
        - Provide constructive feedback on code submissions
        - Keep responses concise and focused

        Begin the interview by introducing yourself briefly and asking your first technical question."""
        
        response = requests.post(
            SHAPES_API_URL,
            headers={
                "Authorization": f"Bearer {SHAPES_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "shapesinc/carmack",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": "Let's begin the interview."}
                ]
            }
        )
        
        if response.status_code != 200:
            return jsonify({"error": f"Shapes API error: {response.text}"}), response.status_code
            
        return jsonify(response.json())
            
    except Exception as e:
        print(f"Error in start_interview: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/continue_interview', methods=['POST'])
def continue_interview():
    try:
        data = request.json
        message = data.get('message')
        
        if not message:
            return jsonify({"error": "Missing message"}), 400
            
        if not SHAPES_API_KEY:
            return jsonify({"error": "Shapes API key not configured"}), 500
        
        response = requests.post(
            SHAPES_API_URL,
            headers={
                "Authorization": f"Bearer {SHAPES_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "shapesinc/carmack",
                "messages": [
                    {"role": "user", "content": message}
                ]
            }
        )
        
        if response.status_code != 200:
            return jsonify({"error": f"Shapes API error: {response.text}"}), response.status_code
            
        return jsonify(response.json())
        
    except Exception as e:
        print(f"Error in continue_interview: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/send_code', methods=['POST'])
def send_code():
    try:
        data = request.json
        code = data.get('code')
        
        if not code:
            return jsonify({"error": "Missing code"}), 400
            
        if not SHAPES_API_KEY:
            return jsonify({"error": "Shapes API key not configured"}), 500
        
        system_prompt = """You are Carmack, a Python technical interviewer. Review the submitted code and provide feedback on:
        - Code correctness and efficiency
        - Python best practices and conventions
        - Potential improvements or alternative approaches
        Keep your feedback concise and constructive."""
        
        response = requests.post(
            SHAPES_API_URL,
            headers={
                "Authorization": f"Bearer {SHAPES_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "shapesinc/carmack",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Please review this code:\n\n```python\n{code}\n```"}
                ]
            }
        )
        
        if response.status_code != 200:
            return jsonify({"error": f"Shapes API error: {response.text}"}), response.status_code
            
        return jsonify(response.json())
        
    except Exception as e:
        print(f"Error in send_code: {str(e)}")
        return jsonify({"error": str(e)}), 500

def reset_shape_memory():
    # Reset both long-term and short-term memory for a clean slate
    for cmd in ["!reset", "!wack"]:
        requests.post(
            SHAPES_API_URL,
            headers={
                "Authorization": f"Bearer {SHAPES_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "shapesinc/carmack",
                "messages": [
                    {"role": "user", "content": cmd}
                ]
            }
        )

if __name__ == '__main__':
    app.run(debug=True) 