from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterWithCardRequest,
    UserOut,
)
from app.services.auth_service import (
    authenticate_user,
    create_access_token,
    get_current_user,
)
from app.services.registration_service import (
    create_registration,
    register_with_card,
)
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, body.email, body.password)
    token = create_access_token(user.id, user.role)
    return LoginResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/register", response_model=UserOut, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user (card_id=None, can be linked later)."""
    user = create_registration(db, body.name, body.email, body.password)
    return user


@router.post("/register/with-card", response_model=UserOut, status_code=201)
def register_direct(body: RegisterWithCardRequest, db: Session = Depends(get_db)):
    """Register and scan card at the same time — creates user directly."""
    user = register_with_card(db, body.name, body.email, body.password, body.card_id)
    return user


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
