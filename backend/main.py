import os, json
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from groq import Groq

# --- PATHS & CONFIG ---
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
load_dotenv(dotenv_path=BASE_DIR / "backend" / ".env")

app = FastAPI()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_methods=["*"], 
    allow_headers=["*"]
)

chat_history = []

@app.post("/chat")
async def chat(msg: str):
    # Strict prompt to ensure valid JSON and clickable URLs
    SYSTEM_PROMPT = (
        "You are ShopSage, a professional shopping assistant. "
        "Return ONLY a JSON object with: 'reply' (string) and 'products' (list). "
        "For each product, include: 'name', 'price_range' (e.g. '₹45k - ₹50k'), "
        "'platform' (e.g. 'Amazon'), and 'url' (a direct search link)."
    )
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": msg}
            ],
            response_format={"type": "json_object"}
        )
        data = json.loads(completion.choices[0].message.content)
        
        # Save to session history
        chat_history.append({"message": msg, "reply": data.get('reply')})
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail="AI Service Error")

@app.get("/history")
def get_history():
    return chat_history

app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
