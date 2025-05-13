import os
import json
import asyncio
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import httpx

load_dotenv()

API_KEY = os.getenv("API_KEY")
API_BASE_URL = os.getenv("BASE_URL")
uid =os.getenv("user_id", "default")
chid = os.getenv("channel_id", "public")
app = FastAPI()

# CORS (allow frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    data = await request.json()

    user_text = ""
    for msg in data.get("messages", []):
        if msg.get("role") == "user":
            user_text = msg.get("content")
            break

    model = data.get("model", "shapesinc/beta-1q75")

    # Send real POST request to Shapes API (non-stream)
    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(
                f"{API_BASE_URL}/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {API_KEY}",
                    "Content-Type": "application/json",
                    "X-User-Id": uid,
        		    "X-Channel-Id": chid
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": user_text}],
                }
            )
        except Exception as e:
            return JSONResponse(content={"error": str(e)}, status_code=500)

    if r.status_code != 200:
        return JSONResponse(content={"error": r.text}, status_code=r.status_code)

    try:
        completion = r.json()["choices"][0]["message"]["content"]
    except Exception:
        return JSONResponse(content={"error": "Invalid response format"}, status_code=500)

    # emulate streaming character-by-character
    async def fake_stream():
        for char in completion:
            chunk = {
                "choices": [
                    {
                        "delta": {"content": char},
                        "finish_reason": None,
                    }
                ]
            }
            yield f"data: {json.dumps(chunk)}\n\n"
            await asyncio.sleep(0.01)
        # end of stream
        yield "data: [DONE]\n\n"

    return StreamingResponse(fake_stream(), media_type="text/event-stream")


@app.get("/v1/models")
async def get_models():
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{API_BASE_URL}/v1/models",
            headers={"Authorization": f"Bearer {API_KEY}"}
        )
        return JSONResponse(content=r.json(), status_code=r.status_code)
