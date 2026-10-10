from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleLogin(BaseModel):
    token: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    name: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
