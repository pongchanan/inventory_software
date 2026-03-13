from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    LoginRequest,
    TokenResponse,
    UserResponse,
    KioskPrepareRequest,
    KioskStatusResponse,
)
from app.auth import (
    get_current_user,
    hash_password,
    verify_password,
)
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    return auth_service.login(credentials, db)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user


@router.post("/kiosk/prepare_registration")
def prepare_kiosk_registration(request: KioskPrepareRequest):
    return auth_service.prepare_kiosk_registration(request)


@router.get("/kiosk/status/{kiosk_id}", response_model=KioskStatusResponse)
def check_kiosk_registration_status(kiosk_id: str):
    return auth_service.check_kiosk_registration_status(kiosk_id)
