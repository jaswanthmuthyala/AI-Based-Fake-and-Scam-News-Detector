
import logging
import os
import time
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

BACKEND_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = Path(__file__).resolve().parents[2]

load_dotenv(BACKEND_DIR / ".env")
load_dotenv(ROOT_DIR / ".env")
load_dotenv()

from .mongodb import check_mongodb_connection
from .routers import analyze, auth, history

logger = logging.getLogger("uvicorn.error")

app = FastAPI(
    title="AI Based Fake News and Scam Detector API",
    description="Backend API for Fake News and Scam Detector",
    version="1.0.0",
)

raw_frontend_origin = os.getenv(
    "FRONTEND_ORIGIN",
    "https://ai-based-fake-and-scam-news-detecto.vercel.app",
)

configured_origins = [
    origin.strip().rstrip("/")
    for origin in raw_frontend_origin.split(",")
    if origin.strip()
]

default_origins = [
    "https://ai-based-fake-and-scam-news-detecto.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

origins = list(dict.fromkeys(configured_origins + default_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://[a-zA-Z0-9-]+\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

request_counts = {}
RATE_LIMIT = 100
RATE_LIMIT_WINDOW = 60


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.method == "OPTIONS" or request.url.path in (
        "/api/health",
        "/api/database-health",
    ):
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"
    current_time = time.time()

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

    return await call_next(request)


# Existing routers only. No Admin router.
app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(analyze.router, prefix="/api", tags=["Analysis"])
app.include_router(history.router, prefix="/api", tags=["History & Stats"])


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "API is running correctly.",
    }


@app.get("/api/database-health")
def database_health():
    try:
        check_mongodb_connection()
        return {
            "status": "ok",
            "database": "MongoDB",
            "message": "MongoDB connection successful.",
        }
    except Exception:
        logger.exception("MongoDB health check failed")
        return JSONResponse(
            status_code=503,
            content={
                "status": "error",
                "database": "MongoDB",
                "message": "MongoDB connection failed.",
            },
        )
