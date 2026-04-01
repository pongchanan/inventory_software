from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import hash_password, require_admin
from app.models.user import User
from app.schemas.user_api import UserCreate, UserUpdate, UserResponse
from app.services import users_service


router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    return users_service.create_user(db, user)


@router.get("", response_model=List[UserResponse])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return users_service.list_users(db, skip, limit)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    return users_service.get_user_or_404(db, user_id)


@router.get("/by-nfc/{nfc_card_uid}", response_model=UserResponse)
def get_user_by_nfc(nfc_card_uid: str, db: Session = Depends(get_db)):
    return users_service.get_user_by_nfc_or_404(db, nfc_card_uid)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int, 
    user_update: UserUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update user. Requires admin privileges."""
    return users_service.update_user(db, user_id, user_update)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    users_service.delete_user(db, user_id)
