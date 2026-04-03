from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.open_session import PaginatedSessions
from app.services.auth_service import require_admin
from app.services.sessions_service import get_sessions

router = APIRouter(
    prefix="/api/sessions", tags=["Sessions"], dependencies=[Depends(require_admin)]
)


@router.get("/", response_model=PaginatedSessions)
def list_sessions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return get_sessions(db, page, page_size)
