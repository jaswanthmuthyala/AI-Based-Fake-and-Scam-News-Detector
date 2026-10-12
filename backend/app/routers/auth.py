
import os
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Request, Response
from pymongo.errors import DuplicateKeyError

from ..core.security import (
    create_access_token,
    get_current_user_id,
    get_password_hash,
    get_token_from_request,
    verify_password,
)
from ..mongodb import users_collection
from ..schemas.auth import UserCreate, UserLogin, UserResponse

router = APIRouter(prefix="/auth")

SESSION_COOKIE_NAME = "session_token"


def get_cookie_settings():
    env_str = os.getenv("ENVIRONMENT", "").lower()
    is_prod = env_str == "production" or os.getenv("RENDER") is not None

    secure_override = os.getenv("COOKIE_SECURE")
    secure = (
        secure_override.lower() in ("true", "1", "yes")
        if secure_override is not None
        else is_prod
    )

    samesite_override = os.getenv("COOKIE_SAMESITE")
    samesite = (
        samesite_override.lower()
        if samesite_override
        else ("none" if secure else "lax")
    )

    return {"secure": secure, "samesite": samesite}


def user_response(user):
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user.get("name"),
        "created_at": user["created_at"],
    }


@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate):
    email = str(user_in.email).strip().lower()

    if len(user_in.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters.",
        )

    if users_collection.find_one({"email": email}):
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists.",
        )

    user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "name": user_in.name.strip() if user_in.name else "User",
        "password_hash": get_password_hash(user_in.password),
        "created_at": datetime.now(timezone.utc),
    }

    try:
        users_collection.insert_one(user)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists.",
        )

    return user_response(user)


@router.post("/login")
def login(user_in: UserLogin, response: Response):
    email = str(user_in.email).strip().lower()
    user = users_collection.find_one({"email": email})

    if not user or not verify_password(
        user_in.password, user.get("password_hash")
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password.",
        )

    token = create_access_token(
        data={"sub": user["id"]},
        expires_delta=timedelta(days=7),
    )

    cookie_cfg = get_cookie_settings()
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=cookie_cfg["secure"],
        samesite=cookie_cfg["samesite"],
        max_age=7 * 24 * 60 * 60,
        path="/",
    )

    return {
        "message": "Logged in successfully",
        "user": user_response(user),
    }


@router.post("/logout")
def logout(response: Response):
    cookie_cfg = get_cookie_settings()
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        httponly=True,
        secure=cookie_cfg["secure"],
        samesite=cookie_cfg["samesite"],
        path="/",
    )

    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def get_me(request: Request):
    session_token = get_token_from_request(request)

    if not session_token:
        raise HTTPException(
            status_code=401,
            detail="Not logged in. Please sign in.",
        )

    user_id = get_current_user_id(session_token)

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Session expired or invalid. Please sign in again.",
        )

    user = users_collection.find_one({"id": user_id})

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User account not found. Please sign in again.",
        )

    return user_response(user)
