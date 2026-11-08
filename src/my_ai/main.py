import asyncio
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from my_ai.bot_engine import Message, stream_my_reply

async def keep_alive_ping():
    """Pings the public Render URL every 12 minutes so the free instance doesn't spin down."""
    await asyncio.sleep(30)  # Wait for server startup
    render_url = os.getenv("RENDER_EXTERNAL_URL")
    if not render_url:
        return  # Skip when running locally

    ping_url = f"{render_url.rstrip('/')}/api/health"
    async with httpx.AsyncClient(timeout=10.0) as client:
        while True:
            try:
                await client.get(ping_url)
            except Exception:
                pass
            await asyncio.sleep(12 * 60)  # Every 12 minutes (720 seconds)

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(keep_alive_ping())
    yield
    task.cancel()

app = FastAPI(title="Krish Italiya - AI Assistant", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    history: List[Message] = []

@app.get("/api/health")
async def health_check():
    return {"status": "awake"}

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    return StreamingResponse(
        stream_my_reply(req.message, req.history),
        media_type="text/plain; charset=utf-8",
    )

BASE_DIR = Path(__file__).resolve().parent.parent.parent
app.mount("/assets", StaticFiles(directory=BASE_DIR / "assets"), name="assets")

# Serve compiled React frontend in production
DIST_DIR = BASE_DIR / "ui" / "dist"
if DIST_DIR.exists():
    app.mount("/", StaticFiles(directory=DIST_DIR, html=True), name="ui")