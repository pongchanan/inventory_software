from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    uid: str
    name: str
    email: Optional[str] = None
    role: str = "user"
    authorized: bool = True


class UserCreate(UserBase):
    password: Optional[str] = None  # plain-text password, hashed on save


class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class KioskPrepareRequest(BaseModel):
    kiosk_id: str
    name: str
    email: str
    password: str


class KioskScanRequest(BaseModel):
    kiosk_id: str
    uid: str


class KioskStatusResponse(BaseModel):
    status: str
    access_token: Optional[str] = None
    user: Optional[UserResponse] = None
