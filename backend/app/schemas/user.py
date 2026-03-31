from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    nfc_card_uid: str
    name: str
    email: Optional[str] = None
    role: str = "user"
    active: bool = True


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


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    
    @field_validator('password')
    @classmethod
    def validate_password_length(cls, v: str) -> str:
        """Validate that password doesn't exceed bcrypt's 72 byte limit."""
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password must not exceed 72 bytes (approximately 72 characters)')
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class RegistrationResponse(BaseModel):
    message: str
    user: UserResponse


class LinkNFCCardRequest(BaseModel):
    nfc_card_uid: str


class KioskPrepareRequest(BaseModel):
    kiosk_id: str
    name: str
    email: str
    password: str


class KioskScanRequest(BaseModel):
    kiosk_id: str
    nfc_card_uid: str


class KioskStatusResponse(BaseModel):
    status: str
    access_token: Optional[str] = None
    user: Optional[UserResponse] = None
