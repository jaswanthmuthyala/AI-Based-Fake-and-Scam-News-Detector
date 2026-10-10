from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
from dotenv import load_dotenv

from .models.db import engine, Base
from .routers import analyze, history, auth

load_dotenv()

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Based Fake News and Scam Detector API",
    description="Backend API for Fake News and Scam Detector",
    version="1.0.0"
)

# CORS
import os
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
origins = [
    FRONTEND_ORIGIN,
    "http://localhost:5173",
    "http://localhost:3000"
]
origins = list(set(origins))


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Basic Rate Limiting (in-memory, simple)
# For demo purposes
request_counts = {}
RATE_LIMIT = 50 # requests per minute
RATE_LIMIT_WINDOW = 60

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host
    current_time = time.time()
    
    # Clean up old entries
    for ip, data in list(request_counts.items()):
        if current_time - data["start_time"] > RATE_LIMIT_WINDOW:
            del request_counts[ip]
            
    if client_ip not in request_counts:
        request_counts[client_ip] = {"count": 1, "start_time": current_time}
    else:
        if current_time - request_counts[client_ip]["start_time"] < RATE_LIMIT_WINDOW:
            request_counts[client_ip]["count"] += 1
            if request_counts[client_ip]["count"] > RATE_LIMIT:
                return JSONResponse(status_code=429, content={"detail": "Too Many Requests. Please slow down."})
        else:
            # Reset window
            request_counts[client_ip] = {"count": 1, "start_time": current_time}
            
    response = await call_next(request)
    return response

# Routers
app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(analyze.router, prefix="/api", tags=["Analysis"])
app.include_router(history.router, prefix="/api", tags=["History & Stats"])

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "API is running correctly."}
