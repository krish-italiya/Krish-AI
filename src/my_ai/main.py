import asyncio
import os
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List
import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from my_ai.bot_engine import Message, stream_my_reply

# In-memory sliding window rate limiter per IP
RATE_LIMIT_PER_MIN = 8
RATE_LIMIT_PER_HOUR = 40
ip_requests: dict[str, deque[float]] = defaultdict(deque)

def is_rate_limited(client_ip: str) -> str | None:
    now = time.time()
    timestamps = ip_requests[client_ip]

    # Remove timestamps older than 1 hour (3600s)
    while timestamps and now - timestamps[0] > 3600:
        timestamps.popleft()

    if len(timestamps) >= RATE_LIMIT_PER_HOUR:
        return "Whoa, you've sent quite a few messages this hour! Feel free to reach out to me directly on LinkedIn or email (krishitaliya11@gmail.com) so we can chat more."

    recent_min = sum(1 for t in timestamps if now - t < 60)
    if recent_min >= RATE_LIMIT_PER_MIN:
        return "You're typing super fast! Give me about 30 seconds to catch my breath and try sending that again."

    timestamps.append(now)
    return None

async def keep_alive_ping():
    await asyncio.sleep(30)
    render_url = os.getenv("RENDER_EXTERNAL_URL")
    if not render_url:
        return
    ping_url = f"{render_url.rstrip('/')}/api/health"
    async with httpx.AsyncClient(timeout=10.0) as client:
        while True:
            try:
                await client.get(ping_url)
            except Exception:
                pass
            await asyncio.sleep(12 * 60)

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
    message: str = Field(..., min_length=1, max_length=4000)
    history: List[Message] = Field(default_factory=list, max_length=16)

@app.get("/api/health")
async def health_check():
    return {"status": "awake"}

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest, request: Request):
    # Extract real visitor IP behind Render's reverse proxy
    forwarded = request.headers.get("x-forwarded-for")
    client_ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")

    limit_msg = is_rate_limited(client_ip)
    if limit_msg:
        async def rate_limit_stream():
            yield limit_msg
        return StreamingResponse(rate_limit_stream(), media_type="text/plain; charset=utf-8")

    # Keep only the last 10 turns of history to protect token quota
    trimmed_history = req.history[-10:]
    return StreamingResponse(
        stream_my_reply(req.message, trimmed_history),
        media_type="text/plain; charset=utf-8",
    )

BASE_DIR = Path(__file__).resolve().parent.parent.parent
app.mount("/assets", StaticFiles(directory=BASE_DIR / "assets"), name="assets")

DIST_DIR = BASE_DIR / "ui" / "dist"
if DIST_DIR.exists():
    app.mount("/", StaticFiles(directory=DIST_DIR, html=True), name="ui")