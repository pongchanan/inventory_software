from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    card_id: str | None
    is_blacklist: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    register_card_now: bool = False


class RegisterWithCardRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    card_id: str
