from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.access_session_api import AccessSessionCreate, AccessSessionClose, AccessSessionResponse
from app.services import access_sessions_service


router = APIRouter(prefix="/api/sessions", tags=["access-sessions"])


@router.post("", response_model=AccessSessionResponse, status_code=status.HTTP_201_CREATED)
def open_session(session: AccessSessionCreate, db: Session = Depends(get_db)):
    return access_sessions_service.open_session(db, session)


@router.get("", response_model=List[AccessSessionResponse])
def list_sessions(
    user_id: Optional[int] = None,
    unit_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return access_sessions_service.list_sessions(db, user_id, unit_id, status, skip, limit)


@router.get("/{session_id}", response_model=AccessSessionResponse)
def get_session(session_id: int, db: Session = Depends(get_db)):
    return access_sessions_service.get_session_or_404(db, session_id)


@router.post("/{session_id}/close")
def close_session(session_id: int, db: Session = Depends(get_db)):
    return access_sessions_service.close_session(db, session_id)


@router.get("/user/{user_id}/active")
def get_user_active_session(user_id: int, db: Session = Depends(get_db)):
    return access_sessions_service.get_user_active_session_or_404(db, user_id)
