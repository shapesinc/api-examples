# Python Technical Interview Simulator

A web application that simulates Python technical interviews using the Shapes API with Carmack. Practice your Python interview skills with an AI interviewer that provides expert technical feedback.

## Features

- Python technical interview with Carmack (John Carmack inspired personality)
- Code editor for solving coding problems
- Real-time interview simulation
- Modern dark-themed user interface
- Responsive design

## Prerequisites

- Python 3.8 or higher
- Shapes API key
- pip (Python package manager)

## Setup

1. Clone the repository and navigate to the interviewer directory:
   ```bash
   cd examples/education/interviewer
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows, use: venv\Scripts\activate
   ```

3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the interviewer directory and add your Shapes API key:
   ```
   SHAPES_API_KEY=your_api_key_here
   ```

## Running the Application

1. Make sure your virtual environment is activated
2. Run the Flask application:
   ```bash
   python app.py
   ```
3. Open your web browser and navigate to `http://localhost:5000`

## Usage

1. Click "Start Interview" to begin
2. Respond to the interviewer's questions in the chat interface
3. Press Enter or click "Send" to submit your response
4. Use the code editor panel for coding challenges
5. Submit your code solutions with the "Send Code" button

## Note

Make sure to keep your Shapes API key secure and never commit it to version control. 