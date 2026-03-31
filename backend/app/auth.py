from datetime import datetime, timedelta
import os
from typing import Optional
import jwt
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User

# Configuration
SECRET_KEY = os.environ.get("JWT_SECRET", "your-secret-key")
ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
if ALGORITHM == "your_jwt_algorithm":
    ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Hardcoded Poweruser (Bypasses Database)
POWERUSER_EMAIL = "poweruser@gmail.com"
POWERUSER_PASSWORD = "poweruser"
POWERUSER_UID = "POWERUSER-ADMIN"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    """Hash password using bcrypt. Password should be validated before calling this function.
    Truncates to 72 bytes as a safety measure.
    """
    # Bcrypt has a 72-byte limit, so truncate password if necessary
    if len(password.encode('utf-8')) > 72:
        password = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Decode JWT and return the current user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        uid: str = payload.get("sub")
        if uid is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception

    # Check for hardcoded poweruser first
    if uid == POWERUSER_UID:
        return User(
            id=0,
            nfc_card_uid=POWERUSER_UID,
            name="Power User",
            email=POWERUSER_EMAIL,
            role="admin",
            active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

    user = db.query(User).filter(User.uid == uid).first()
    if user is None:
        raise credentials_exception
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency that ensures the current user is an admin."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
