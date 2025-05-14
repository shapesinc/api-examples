# Tech Interview Simulator

A web application that simulates technical interviews using the Shapes API. Practice your interview skills with an AI interviewer that adapts to different personality types and technical domains.

## Features

- Choose from different technical domains (Python, React, C)
- Select interviewer personality (Friendly, Strict, Casual)
- Real-time interview simulation
- Modern and clean user interface
- Responsive design

## Prerequisites

- Python 3.8 or higher
- Shapes API key
- pip (Python package manager)

## Setup

1. Clone the repository and navigate to the interviewer directory:
   ```bash
   cd interviewer
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

1. Select your desired technology (Python, React, or C)
2. Choose an interviewer personality (Friendly, Strict, or Casual)
3. Click "Start Interview" to begin
4. Respond to the interviewer's questions in the chat interface
5. Press Enter or click "Send" to submit your response

## Note

Make sure to keep your Shapes API key secure and never commit it to version control. 