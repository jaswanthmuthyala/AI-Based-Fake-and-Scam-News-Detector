
<<<<<<< HEAD
import os
import time
=======
import logging
import os
import time
from pathlib import Path
>>>>>>> 6c84566 (Complete MongoDB migration)

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
<<<<<<< HEAD

from .models.db import engine, Base
from .routers import analyze, history, auth
=======
>>>>>>> 6c84566 (Complete MongoDB migration)

# Load environment explicitly
BACKEND_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(ROOT_DIR / ".env")
load_dotenv()

<<<<<<< HEAD
# Create database tables
Base.metadata.create_all(bind=engine)
=======
from .mongodb import check_mongodb_connection
from .routers import analyze, auth, history

logger = logging.getLogger("uvicorn.error")
>>>>>>> 6c84566 (Complete MongoDB migration)

# Create FastAPI application
app = FastAPI(
    title="AI Based Fake News and Scam Detector API",
    description="Backend API for Fake News and Scam Detector",
    version="1.0.0",
)

<<<<<<< HEAD
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
=======
# CORS configuration supporting Vercel production, preview deployments, and local dev
raw_frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
configured_origins = [
    orig.strip()
    for orig in raw_frontend_origin.split(",")
    if orig.strip()
]

default_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "https://ai-based-fake-and-scam-news-detecto.vercel.app",
]

origins = list(dict.fromkeys(configured_origins + default_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
>>>>>>> 6c84566 (Complete MongoDB migration)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

<<<<<<< HEAD
# Basic in-memory rate limiting
request_counts = {}
RATE_LIMIT = 50
=======
request_counts = {}
RATE_LIMIT = 100
>>>>>>> 6c84566 (Complete MongoDB migration)
RATE_LIMIT_WINDOW = 60


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
<<<<<<< HEAD
    # Allow browser CORS preflight requests through
    if request.method == "OPTIONS":
=======
    # Never rate-limit CORS preflight requests or health checks
    if request.method == "OPTIONS" or request.url.path in (
        "/api/health",
        "/api/database-health",
    ):
>>>>>>> 6c84566 (Complete MongoDB migration)
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"
    current_time = time.time()

<<<<<<< HEAD
    # Remove expired rate-limit entries
=======
>>>>>>> 6c84566 (Complete MongoDB migration)
    for ip, data in list(request_counts.items()):
        if current_time - data["start_time"] >= RATE_LIMIT_WINDOW:
            del request_counts[ip]
<<<<<<< HEAD

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
=======

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
                        "detail": "Too Many Requests. Please slow down."
                    },
                )
        else:
            request_counts[client_ip] = {
                "count": 1,
                "start_time": current_time,
            }

    return await call_next(request)


>>>>>>> 6c84566 (Complete MongoDB migration)
app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(analyze.router, prefix="/api", tags=["Analysis"])
app.include_router(history.router, prefix="/api", tags=["History & Stats"])


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "API is running correctly.",
    }
<<<<<<< HEAD
=======


@app.get("/api/database-health")
def database_health():
    try:
        check_mongodb_connection()
        return {
            "status": "ok",
            "database": "MongoDB",
            "message": "MongoDB connection successful.",
        }
    except Exception as exc:
        logger.error("MongoDB health check failed: %s", exc)
        return JSONResponse(
            status_code=503,
            content={
                "status": "error",
                "database": "MongoDB",
                "message": "MongoDB connection failed.",
            },
        )

>>>>>>> 6c84566 (Complete MongoDB migration)
