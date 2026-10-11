
# CORS
import os

FRONTEND_ORIGIN = os.getenv(
    "FRONTEND_ORIGIN",
    "https://ai-based-fake-and-scam-news-detector.vercel.app"
).rstrip("/")

origins = [
    FRONTEND_ORIGIN,
    "https://ai-based-fake-and-scam-news-detector.vercel.app",
    "https://ai-based-fake-and-scam-news-detector-git-main-jaswanthmuthyala.vercel.app",
    "https://ai-based-fake-and-scam-news-detector-cef2eazyj-jaswanthmuthyala.vercel.app",
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
