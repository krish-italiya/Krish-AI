from pathlib import Path
from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from my_ai.bot_engine import Message, stream_my_reply

app = FastAPI(title="My AI Portfolio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    history: List[Message] = []

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    return StreamingResponse(
        stream_my_reply(req.message, req.history),
        media_type="text/plain; charset=utf-8",
    )

BASE_DIR = Path(__file__).resolve().parent.parent.parent
app.mount("/assets", StaticFiles(directory=BASE_DIR / "assets"), name="assets")

# In production, serve the compiled React frontend from ui/dist
DIST_DIR = BASE_DIR / "ui" / "dist"
if DIST_DIR.exists():
    app.mount("/", StaticFiles(directory=DIST_DIR, html=True), name="ui")