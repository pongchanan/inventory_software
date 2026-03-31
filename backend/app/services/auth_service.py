from __future__ import annotations

import time
from datetime import datetime
from typing import Dict, Optional
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.auth import POWERUSER_EMAIL, POWERUSER_PASSWORD, POWERUSER_UID, create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.user import KioskPrepareRequest, KioskStatusResponse, LoginRequest, TokenResponse, UserResponse, RegisterRequest, RegistrationResponse


KIOSK_REGISTRATION_TIMEOUT = 120
pending_registrations: Dict[str, dict] = {}


def register(request: RegisterRequest, db: Session) -> TokenResponse:
    """Register a new user with email and password and return access token."""
    # Validate password length before processing
    if len(request.password.encode('utf-8')) > 72:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must not exceed 72 bytes (approximately 72 characters)"
        )
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user with unique NFC UID (for now, use email-based identifier)
    nfc_card_uid = f"USER-{uuid.uuid4().hex[:12].upper()}"
    
    new_user = User(
        nfc_card_uid=nfc_card_uid,
        name=request.name,
        email=request.email,
        password_hash=hash_password(request.password),
        role="user",
        active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create JWT token for immediate login
    token = create_access_token(data={"sub": new_user.nfc_card_uid, "role": new_user.role})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(new_user)
    )


def login(credentials: LoginRequest, db: Session) -> TokenResponse:
    if credentials.email == POWERUSER_EMAIL and credentials.password == POWERUSER_PASSWORD:
        mock_user = User(
            id=0,
            nfc_card_uid=POWERUSER_UID,
            name="Power User",
            email=POWERUSER_EMAIL,
            role="admin",
            active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        token = create_access_token(data={"sub": POWERUSER_UID, "role": "admin"})
        return TokenResponse(access_token=token, user=UserResponse.model_validate(mock_user))

    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.authorized:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    token = create_access_token(data={"sub": user.uid, "role": user.role})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


def prepare_kiosk_registration(request: KioskPrepareRequest) -> dict:
    existing: Optional[dict] = pending_registrations.get(request.kiosk_id)
    if existing and existing["expires_at"] > time.time() and existing["status"] == "waiting":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Kiosk {request.kiosk_id} is already in use by another pending registration.",
        )

    pending_registrations[request.kiosk_id] = {
        "name": request.name,
        "email": request.email,
        "password_hash": hash_password(request.password),
        "expires_at": time.time() + KIOSK_REGISTRATION_TIMEOUT,
        "status": "waiting",
        "user": None,
        "token": None,
    }
    return {
        "message": "Pending registration created. Please scan card at kiosk.",
        "kiosk_id": request.kiosk_id,
    }


def check_kiosk_registration_status(kiosk_id: str) -> KioskStatusResponse:
    pending_data = pending_registrations.get(kiosk_id)
    if pending_data is None:
        return KioskStatusResponse(status="not_found")

    if pending_data["expires_at"] < time.time():
        del pending_registrations[kiosk_id]
        return KioskStatusResponse(status="expired")

    if pending_data["status"] == "success":
        response = KioskStatusResponse(
            status="success",
            access_token=pending_data["token"],
            user=UserResponse.model_validate(pending_data["user"]),
        )
        del pending_registrations[kiosk_id]
        return response

    return KioskStatusResponse(status="waiting")
