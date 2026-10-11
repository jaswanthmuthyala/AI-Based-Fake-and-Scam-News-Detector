
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import os
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

# CORS — add middleware only AFTER app is created
FRONTEND_ORIGIN = os.getenv(
    "FRONTEND_ORIGIN",
    "https://ai-based-fake-and-scam-news-detector.vercel.app"
).rstrip("/")

origins = [
    FRONTEND_ORIGIN,
    "https://ai-based-fake-and-scam-news-detector.vercel.app",
    "https://ai-based-fake-and-scam-news-detector-git-main-jaswanthmuthyala.vercel.app",
    "https://ai-based-fake-and-scam-news-detector-cef2eazyj-jaswanthmuthyala.vercel.app",
    "https://ai-based-fake-and-scam-news-detector-chs7ix0ee-jaswanthmuthyala.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set(origins)),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
