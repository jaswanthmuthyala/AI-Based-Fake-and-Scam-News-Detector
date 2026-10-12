
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient

logger = logging.getLogger("uvicorn.error")

# Explicitly load backend/.env and root .env if present
BACKEND_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = Path(__file__).resolve().parents[2]

load_dotenv(BACKEND_DIR / ".env")
load_dotenv(ROOT_DIR / ".env")
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise RuntimeError(
        "MONGODB_URI is missing from environment. Please configure MONGODB_URI in backend/.env or your deployment environment variables."
    )

client = MongoClient(
    MONGODB_URI,
    serverSelectionTimeoutMS=10000,
)

db_name = os.getenv("MONGODB_DB_NAME", "fake_scam_detector")
db = client[db_name]

users_collection = db["users"]
scan_history_collection = db["scan_history"]


def init_indexes():
    """Ensure necessary indexes exist for performance and uniqueness."""
    try:
        users_collection.create_index("email", unique=True)
        users_collection.create_index("id", unique=True)
        users_collection.create_index([("created_at", -1)])

        scan_history_collection.create_index("id", unique=True)
        scan_history_collection.create_index([("user_id", 1), ("created_at", -1)])
        scan_history_collection.create_index([("created_at", -1)])
        logger.info("MongoDB indexes verified successfully.")
    except Exception as exc:
        logger.warning("Could not initialize MongoDB indexes: %s", exc)


init_indexes()


def check_mongodb_connection():
    """Pings MongoDB to verify active connection."""
    client.admin.command("ping")
    return True

