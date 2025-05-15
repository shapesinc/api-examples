this script allow proxy request to shapes with streaming response what is natively not support it.

Step-by-Step Setup Instructions
1. Prepare your project folder
2. download your files from repo:
it should look like:
proxy.py — your FastAPI app
.env — for your API key and base URL
requirements.txt — dependencies list
3. fill env file
```
BASE_URL=https://api.shapes.inc
API_KEY=your api key
user_id=something
channel_id=something
```
4. install dependencies
```
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```
5.Run Server
```
python3 -m uvicorn proxy:app --reload
```
This will start your proxy at http://127.0.0.1:8000

Server Cover Endpoints:
```
POST /v1/chat/completions
Emulates streaming responses for chat completions.
```
and
```
GET /v1/models
Forwards model list from the upstream API.
```
You can test it with curl
```
curl -N -X POST http://127.0.0.1:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"shapesinc/beta-1q75", "messages":[{"role":"user", "content":"Hello!"}]}'
```
Happy testing.

