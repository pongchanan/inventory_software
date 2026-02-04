from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    # Check if UID already exists
    existing = db.query(User).filter(User.uid == user.uid).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with UID {user.uid} already exists"
        )
    
    db_user = User(**user.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/{uid}", response_model=UserResponse)
def get_user(uid: str, db: Session = Depends(get_db)):
    """
    Get user by UID - Used by kiosk for authorization check.
    Returns 200 if authorized, 403 if not authorized, 404 if not found.
    """
    user = db.query(User).filter(User.uid == uid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with UID {uid} not found"
        )
    
    if not user.authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not authorized"
        )
    
    return user


@router.get("/", response_model=List[UserResponse])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all users"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.put("/{uid}", response_model=UserResponse)
def update_user(uid: str, user_update: UserCreate, db: Session = Depends(get_db)):
    """Update user information"""
    user = db.query(User).filter(User.uid == uid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with UID {uid} not found"
        )
    
    for key, value in user_update.model_dump().items():
        setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{uid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(uid: str, db: Session = Depends(get_db)):
    """Delete a user"""
    user = db.query(User).filter(User.uid == uid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with UID {uid} not found"
        )
    
    db.delete(user)
    db.commit()
    return None
