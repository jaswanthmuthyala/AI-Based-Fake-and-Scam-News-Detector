import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from datetime import timedelta
import os

from ..models.db import get_db, User
from ..schemas.auth import UserCreate, UserLogin, GoogleLogin, UserResponse
from ..core.security import get_password_hash, verify_password, create_access_token, get_current_user_id

router = APIRouter(prefix="/auth")

# Need to match frontend or use a backend env
SESSION_COOKIE_NAME = "session_token"

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system."
        )
    
    if len(user_in.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    user = User(
        id=str(uuid.uuid4()),
        email=user_in.email.lower(),
        name=user_in.name,
        password_hash=get_password_hash(user_in.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login")
def login(user_in: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # Create token
    access_token_expires = timedelta(days=7)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    # Set cookie
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=access_token,
        httponly=True,
        samesite="lax", # Change to "none" + secure=True if frontend is different domain
        secure=os.getenv("ENVIRONMENT") == "production",
        max_age=7 * 24 * 60 * 60,
    )
    return {"message": "Logged in successfully"}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key=SESSION_COOKIE_NAME, httponly=True, samesite="lax")
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
def get_me(request: Request, db: Session = Depends(get_db)):
    session_token = request.cookies.get(SESSION_COOKIE_NAME)
    user_id = get_current_user_id(session_token)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return user
