from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models.access_session_core import AccessSession
from app.models.user import User
from app.models.storage_unit_core import StorageUnit
from app.schemas.access_session_api import AccessSessionCreate, AccessSessionClose, AccessSessionResponse


router = APIRouter(prefix="/api/sessions", tags=["access-sessions"])


@router.post("", response_model=AccessSessionResponse, status_code=status.HTTP_201_CREATED)
def open_session(session: AccessSessionCreate, db: Session = Depends(get_db)):
    """Open a new access session"""
    # Validate user exists
    user = db.query(User).filter(User.id == session.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Validate unit exists
    unit = db.query(StorageUnit).filter(StorageUnit.id == session.unit_id).first()
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Storage unit not found")
    
    db_session = AccessSession(**session.dict())
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


@router.get("", response_model=List[AccessSessionResponse])
def list_sessions(
    user_id: Optional[int] = None,
    unit_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List access sessions with optional filters"""
    query = db.query(AccessSession)
    
    if user_id:
        query = query.filter(AccessSession.user_id == user_id)
    if unit_id:
        query = query.filter(AccessSession.unit_id == unit_id)
    if status:
        query = query.filter(AccessSession.status == status)
    
    sessions = query.offset(skip).limit(limit).all()
    return sessions


@router.get("/{session_id}", response_model=AccessSessionResponse)
def get_session(session_id: int, db: Session = Depends(get_db)):
    """Get access session by ID"""
    session = db.query(AccessSession).filter(AccessSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


@router.post("/{session_id}/close")
def close_session(session_id: int, db: Session = Depends(get_db)):
    """Close an access session"""
    session = db.query(AccessSession).filter(AccessSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    if session.status == "closed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session already closed")
    
    session.status = "closed"
    session.closed_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session


@router.get("/user/{user_id}/active")
def get_user_active_session(user_id: int, db: Session = Depends(get_db)):
    """Get active session for a user (if any)"""
    session = db.query(AccessSession).filter(
        AccessSession.user_id == user_id,
        AccessSession.status == "open"
    ).order_by(AccessSession.opened_at.desc()).first()
    
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active session")
    
    return session
