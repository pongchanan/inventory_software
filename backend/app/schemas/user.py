from pydantic import BaseModel, EmailStr


class CardVerifyRequest(BaseModel):
    card_id: str


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    role: str | None = None
    is_blacklist: bool | None = None
