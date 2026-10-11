
import os
import time

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .models.db import engine, Base
from .routers import analyze, history, auth

load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI application
app = FastAPI(
    title="AI Based Fake News and Scam Detector API",
    description="Backend API for Fake News and Scam Detector",
    version="1.0.0",
)

# CORS configuration
FRONTEND_ORIGIN = os.getenv(
    "FRONTEND_ORIGIN",
    "https://ai-based-fake-and-scam-news-detector.vercel.app",
).rstrip("/")

ALLOWED_ORIGINS = [
    FRONTEND_ORIGIN,
    "https://ai-based-fake-and-scam-news-detector.vercel.app",
    "https://ai-based-fake-and-scam-news-detector-git-main-jaswanthmuthyala.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set(ALLOWED_ORIGINS)),
    allow_origin_regex=(
        r"https://ai-based-fake-and-scam-news-detector"
        r"(?:-[a-z0-9-]+)?\.vercel\.app"
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Basic in-memory rate limiting
request_counts = {}
RATE_LIMIT = 50
RATE_LIMIT_WINDOW = 60


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Allow browser CORS preflight requests through
    if request.method == "OPTIONS":
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"
    current_time = time.time()

    # Remove expired rate-limit entries
    for ip, data in list(request_counts.items()):
        if current_time - data["start_time"] >= RATE_LIMIT_WINDOW:
            del request_counts[ip]

    if client_ip not in request_counts:
        request_counts[client_ip] = {
            "count": 1,
            "start_time": current_time,
        }
    else:
        data = request_counts[client_ip]

        if current_time - data["start_time"] < RATE_LIMIT_WINDOW:
            data["count"] += 1

            if data["count"] > RATE_LIMIT:
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": "Too many requests. Please slow down."
                    },
                )
        else:
            request_counts[client_ip] = {
                "count": 1,
                "start_time": current_time,
            }

    response = await call_next(request)
    return response


# Register API routers
app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(analyze.router, prefix="/api", tags=["Analysis"])
app.include_router(history.router, prefix="/api", tags=["History & Stats"])


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "API is running correctly.",
    }
