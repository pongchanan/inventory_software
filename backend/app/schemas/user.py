from pydantic import BaseModel, EmailStr


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    role: str | None = None
    card_id: str | None = None
    is_blacklist: bool | None = None
