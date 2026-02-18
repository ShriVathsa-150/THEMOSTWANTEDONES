import os
import json
import time
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq

# --- LOAD CONFIG ---
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

GROQ_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_KEY:
    raise ValueError("GROQ_API_KEY not found in .env!")

client = Groq(api_key=GROQ_KEY)
MODEL_ID = "llama-3.3-70b-versatile" # High-performance free model

app = FastAPI(title="ShopSage - Groq Ultra-Fast Edition")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

SYSTEM_PROMPT = """
You are ShopSage, a witty shopping assistant. 
Respond ONLY in JSON format:
{
  "reply": "your conversational advice here",
  "products": [
    {"name": "Product Name", "estimated_price": "₹XX,XXX", "platform": "Amazon", "why_recommended": "reason"}
  ]
}
"""

@app.post("/chat")
async def chat(request: ChatRequest):
    # Try the request up to 3 times if rate limited
    for attempt in range(3):
        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": request.message}
                ],
                model=MODEL_ID,
                response_format={"type": "json_object"}
            )
            
            return json.loads(chat_completion.choices[0].message.content)

        except Exception as e:
            # Handle the 429 "Rate Limit" error specifically
            if "429" in str(e) and attempt < 2:
                time.sleep(2) # Wait 2 seconds and try again
                continue
            print(f"Error: {e}")
            raise HTTPException(status_code=500, detail="The AI is a bit busy. Please try again in a few seconds.")

# Mount Frontend
frontend_path = Path(__file__).parent.parent / "frontend"
app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")