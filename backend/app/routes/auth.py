from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import LoginRequest, TokenResponse, UserResponse, KioskPrepareRequest, KioskScanRequest, KioskStatusResponse
from app.auth import verify_password, hash_password, create_access_token, get_current_user
import time

router = APIRouter(prefix="/api/auth", tags=["auth"])

# In-memory store for pending kiosk registrations
# Key: kiosk_id
# Value: {"name": str, "email": str, "password_hash": str, "expires_at": float, "status": str, "user": User, "token": str}
pending_registrations = {}
KIOSK_REGISTRATION_TIMEOUT = 120  # seconds


@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email and password, returns JWT token."""
    from app.auth import POWERUSER_EMAIL, POWERUSER_PASSWORD, POWERUSER_UID
    from datetime import datetime

    # Check for hardcoded poweruser bypass
    if credentials.email == POWERUSER_EMAIL and credentials.password == POWERUSER_PASSWORD:
        mock_user = User(
            id=0,
            uid=POWERUSER_UID,
            name="Power User",
            email=POWERUSER_EMAIL,
            role="admin",
            authorized=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        token = create_access_token(data={"sub": POWERUSER_UID, "role": "admin"})
        return TokenResponse(
            access_token=token,
            user=UserResponse.model_validate(mock_user),
        )

    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    token = create_access_token(data={"sub": user.uid, "role": user.role})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user


@router.post("/kiosk/prepare_registration")
def prepare_kiosk_registration(request: KioskPrepareRequest):
    """Store student details in memory temporarily waiting for kiosk scan."""
    # Check if a registration is already pending and not expired
    if request.kiosk_id in pending_registrations:
        existing = pending_registrations[request.kiosk_id]
        if existing["expires_at"] > time.time() and existing["status"] == "waiting":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Kiosk {request.kiosk_id} is already in use by another pending registration."
            )
            
    # Hash password right away so we don't store plain-text even in memory
    hashed_pwd = hash_password(request.password)
    
    pending_registrations[request.kiosk_id] = {
        "name": request.name,
        "email": request.email,
        "password_hash": hashed_pwd,
        "expires_at": time.time() + KIOSK_REGISTRATION_TIMEOUT,
        "status": "waiting",
        "user": None,
        "token": None
    }
    return {"message": "Pending registration created. Please scan card at kiosk.", "kiosk_id": request.kiosk_id}


@router.post("/kiosk/scan")
def scan_kiosk_registration(request: KioskScanRequest, db: Session = Depends(get_db)):
    """Physical Kiosk calls this to finalize registration providing the card UID."""
    if request.kiosk_id not in pending_registrations:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending registration found for this kiosk."
        )
        
    pending_data = pending_registrations[request.kiosk_id]
    
    if pending_data["expires_at"] < time.time():
        del pending_registrations[request.kiosk_id]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pending registration expired."
        )
        
    if pending_data["status"] != "waiting":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration is no longer waiting for scan."
        )

    # Check if UID is already in use
    existing_user = db.query(User).filter(User.uid == request.uid).first()
    if existing_user:
        # We could potentially update the user instead if that's the desired flow. 
        # But for 'registration', we assume it's a new card.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This card is already registered."
        )

    # Check if email is already in use
    existing_email = db.query(User).filter(User.email == pending_data["email"]).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email is already in use."
        )

    # Create user in DB
    new_user = User(
        uid=request.uid,
        name=pending_data["name"],
        email=pending_data["email"],
        password_hash=pending_data["password_hash"],
        role="user",
        authorized=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate token for immediate login
    token = create_access_token(data={"sub": new_user.uid, "role": new_user.role})
    
    # Update memory store to notify the polling mobile frontend
    pending_registrations[request.kiosk_id]["status"] = "success"
    pending_registrations[request.kiosk_id]["user"] = new_user
    pending_registrations[request.kiosk_id]["token"] = token
    
    return {"message": "Registration complete.", "uid": request.uid}


@router.get("/kiosk/status/{kiosk_id}", response_model=KioskStatusResponse)
def check_kiosk_registration_status(kiosk_id: str):
    """Mobile Web frontend polls this to see if the physical scan happened."""
    if kiosk_id not in pending_registrations:
        return KioskStatusResponse(status="not_found")
        
    pending_data = pending_registrations[kiosk_id]
    
    if pending_data["expires_at"] < time.time():
        del pending_registrations[kiosk_id]
        return KioskStatusResponse(status="expired")
        
    if pending_data["status"] == "success":
        # Since it succeeded and we're sending the data to frontend, we can clean up memory
        response = KioskStatusResponse(
            status="success",
            access_token=pending_data["token"],
            user=UserResponse.model_validate(pending_data["user"])
        )
        del pending_registrations[kiosk_id]
        return response
        
    return KioskStatusResponse(status="waiting")
