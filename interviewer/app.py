from flask import Flask, render_template, request, jsonify
import os
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

SHAPES_API_KEY = os.getenv('SHAPES_API_KEY')
SHAPES_API_URL = "https://api.shapes.inc/v1/chat/completions"

# Interviewer personalities
PERSONALITIES = {
    "friendly": "Start with technical questions. Ask questions from arrays. You are a friendly and encouraging interviewer who provides constructive feedback. Ask only technical questions related to the category. Do not ask about the candidate's personal life. Keep the conversation strictly related to technical questions. Do NOT use parentheses in your responses. Start by asking a technical question.",
    "strict": "You are a strict and detail-oriented interviewer who expects precise answers. Ask technical questions related to the category.",
    "casual": "You are a casual and laid-back interviewer who makes the candidate feel comfortable. Ask technical questions related to the category."
}

# Interview categories
CATEGORIES = {
    "python": "Python programming language, focusing on core concepts, data structures, and best practices.",
    "react": "React.js framework, focusing on components, hooks, state management, and modern practices.",
    "c": "C programming language, focusing on memory management, pointers, and low-level concepts."
}

@app.route('/')
def index():
    return render_template('index.html', personalities=PERSONALITIES, categories=CATEGORIES)

@app.route('/start_interview', methods=['POST'])
def start_interview():
    data = request.json
    category = data.get('category')
    personality = 'friendly'
    
    if not category:
        return jsonify({"error": "Missing category"}), 400
    
    # Reset memory before starting the interview
    reset_shape_memory()
    
    system_prompt = f"""
    You are a professional technical interviewer with a {personality} style.
    Conduct the interview in a systematic manner:
    - Greet the candidate.
    - Ask one {category} technical question at a time.
    - Wait for the candidate's answer before proceeding.
    - After each answer, provide brief feedback and ask the next question.
    - Do not end the interview unless the user says 'end interview'.
    - Remain professional and focused on the interview at all times.
    """
    
    try:
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
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to get response from Shapes API"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/continue_interview', methods=['POST'])
def continue_interview():
    data = request.json
    user_message = data.get('message')
    category = data.get('category')
    personality = 'friendly'
    
    if not all([user_message, category]):
        return jsonify({"error": "Missing required fields"}), 400
    
    system_prompt = f"""
    {PERSONALITIES[personality]}
    You are conducting a technical interview about {CATEGORIES[category]}.
    Continue the interview based on the candidate's response.
    Provide appropriate feedback and ask follow-up questions when necessary.
    """
    
    try:
        response = requests.post(
            SHAPES_API_URL,
            headers={
                "Authorization": f"Bearer {SHAPES_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "shapesinc/interviewer",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ]
            }
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to get response from Shapes API"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/send_code', methods=['POST'])
def send_code():
    data = request.json
    code = data.get('code')
    category = data.get('category')
    personality = 'friendly'

    if not all([code, category]):
        return jsonify({"error": "Missing required fields"}), 400

    # Compose a message for the Shape to review the code
    user_message = f"Please review the following Python code and provide feedback as an interviewer.\n\n{code}"

    try:
        response = requests.post(
            SHAPES_API_URL,
            headers={
                "Authorization": f"Bearer {SHAPES_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "shapesinc/carmack",
                "messages": [
                    {"role": "user", "content": user_message}
                ]
            }
        )
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Failed to get response from Shapes API"}), 500
    except Exception as e:
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
                "model": "shapesinc/interviewer",
                "messages": [
                    {"role": "user", "content": cmd}
                ]
            }
        )

if __name__ == '__main__':
    app.run(debug=True) 