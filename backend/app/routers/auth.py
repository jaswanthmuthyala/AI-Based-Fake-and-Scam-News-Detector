<<<<<<< HEAD

import os
import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session

from ..models.db import get_db, User
from ..schemas.auth import UserCreate, UserLogin, UserResponse
from ..core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user_id,
)
=======

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
>>>>>>> 6c84566 (Complete MongoDB migration)

router = APIRouter(prefix="/auth")

SESSION_COOKIE_NAME = "session_token"
COOKIE_SECURE = True
COOKIE_SAMESITE = "none"



def get_cookie_settings():
    """Calculates cross-origin cookie settings for local vs production deployment.

    In production (e.g. Render backend + Vercel frontend), cookies MUST be
    Secure + SameSite=None to be sent cross-site. In local HTTP dev, Secure=False
    and SameSite=Lax to allow local browser testing.
    """
    env_str = os.getenv("ENVIRONMENT", "").lower()
    is_prod = env_str == "production" or os.getenv("RENDER") is not None

    cookie_secure_override = os.getenv("COOKIE_SECURE")
    if cookie_secure_override is not None:
        secure = cookie_secure_override.lower() in ("true", "1", "yes")
    else:
        secure = is_prod

    cookie_samesite_override = os.getenv("COOKIE_SAMESITE")
    if cookie_samesite_override:
        samesite = cookie_samesite_override.lower()
    else:
        samesite = "none" if secure else "lax"

    return {"secure": secure, "samesite": samesite}


def user_response(user):
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user.get("name"),
        "created_at": user["created_at"],
    }


@router.post("/register", response_model=UserResponse)
<<<<<<< HEAD
def register(
    user_in: UserCreate,
    db: Session = Depends(get_db),
):
    email = user_in.email.strip().lower()

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists.",
        )

    if len(user_in.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters.",
        )

    user = User(
        id=str(uuid.uuid4()),
        email=email,
        name=user_in.name,
        password_hash=get_password_hash(user_in.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user
=======
def register(user_in: UserCreate):
    email = str(user_in.email).lower().strip()

    if len(user_in.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters.",
        )

    if users_collection.find_one({"email": email}):
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists.",
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
            detail="The user with this email already exists.",
        )

    return user_response(user)

>>>>>>> 6c84566 (Complete MongoDB migration)


@router.post("/login")
<<<<<<< HEAD
def login(
    user_in: UserLogin,
    response: Response,
    db: Session = Depends(get_db),
):
    email = user_in.email.strip().lower()

    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(
        user_in.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password.",
        )

    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(days=7),
    )

=======
def login(user_in: UserLogin, response: Response):
    email = str(user_in.email).lower().strip()
    user = users_collection.find_one({"email": email})

    if not user or not verify_password(
        user_in.password, user.get("password_hash")
    ):
        raise HTTPException(
            status_code=400,
            detail="Incorrect email or password.",
        )

    token = create_access_token(
        data={"sub": user["id"]},
        expires_delta=timedelta(days=7),
    )

    cookie_cfg = get_cookie_settings()

>>>>>>> 6c84566 (Complete MongoDB migration)
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
<<<<<<< HEAD
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
=======
        secure=cookie_cfg["secure"],
        samesite=cookie_cfg["samesite"],
>>>>>>> 6c84566 (Complete MongoDB migration)
        max_age=7 * 24 * 60 * 60,
        path="/",
    )

<<<<<<< HEAD
    return {"message": "Logged in successfully"}
=======
    return {
        "message": "Logged in successfully",
        "user": user_response(user),
    }

>>>>>>> 6c84566 (Complete MongoDB migration)


@router.post("/logout")
def logout(response: Response):
<<<<<<< HEAD
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
=======
    cookie_cfg = get_cookie_settings()

    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        httponly=True,
        secure=cookie_cfg["secure"],
        samesite=cookie_cfg["samesite"],
>>>>>>> 6c84566 (Complete MongoDB migration)
        path="/",
    )

    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
<<<<<<< HEAD
def get_me(
    request: Request,
    db: Session = Depends(get_db),
):
    session_token = request.cookies.get(SESSION_COOKIE_NAME)

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

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User account not found. Please sign in again.",
        )

    return user
=======
def get_me(request: Request):
    session_token = get_token_from_request(request)
    user_id = get_current_user_id(session_token)

    user = users_collection.find_one({"id": user_id})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user_response(user)

>>>>>>> 6c84566 (Complete MongoDB migration)
