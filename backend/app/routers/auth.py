
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

router = APIRouter(prefix="/auth")

SESSION_COOKIE_NAME = "session_token"
COOKIE_SECURE = True
COOKIE_SAMESITE = "none"


@router.post("/register", response_model=UserResponse)
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


@router.post("/login")
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

    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=7 * 24 * 60 * 60,
        path="/",
    )

    return {"message": "Logged in successfully"}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        path="/",
    )

    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
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
