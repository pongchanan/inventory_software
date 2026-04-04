from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.open_session import OpenSession
from app.schemas.open_session import PaginatedSessions
from app.services.auth_service import require_admin
from app.services.s3_storage import get_presigned_url
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


@router.get("/{session_id}/image")
def get_session_image(
    session_id: int,
    db: Session = Depends(get_db),
):
    """Redirect to a 30-minute presigned URL for the session's close image."""
    session = db.query(OpenSession).filter(OpenSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session.close_image_path:
        raise HTTPException(status_code=404, detail="No image for this session")
    url = get_presigned_url(session.close_image_path)
    return RedirectResponse(url=url)
