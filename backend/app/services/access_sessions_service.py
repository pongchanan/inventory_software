from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.access_session_core import AccessSession
from app.schemas.access_session_api import AccessSessionCreate
from app.services.storage_service import get_storage_unit_or_404
from app.services.users_service import get_user_or_404


def open_session(db: Session, payload: AccessSessionCreate) -> AccessSession:
    get_user_or_404(db, payload.user_id)
    get_storage_unit_or_404(db, payload.unit_id)

    db_session = AccessSession(**payload.model_dump())
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


def list_sessions(
    db: Session,
    user_id: Optional[int],
    unit_id: Optional[int],
    status_value: Optional[str],
    skip: int,
    limit: int,
) -> List[AccessSession]:
    query = db.query(AccessSession)
    if user_id:
        query = query.filter(AccessSession.user_id == user_id)
    if unit_id:
        query = query.filter(AccessSession.unit_id == unit_id)
    if status_value:
        query = query.filter(AccessSession.status == status_value)
    return query.offset(skip).limit(limit).all()


def get_session_or_404(db: Session, session_id: int) -> AccessSession:
    session = db.query(AccessSession).filter(AccessSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


def close_session(db: Session, session_id: int) -> AccessSession:
    session = get_session_or_404(db, session_id)
    if session.status == "closed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session already closed")

    session.status = "closed"
    session.closed_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session


def get_user_active_session_or_404(db: Session, user_id: int) -> AccessSession:
    session = (
        db.query(AccessSession)
        .filter(AccessSession.user_id == user_id, AccessSession.status == "open")
        .order_by(AccessSession.opened_at.desc())
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active session")
    return session
