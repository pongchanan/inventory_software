from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.open_session import PaginatedSessions
from app.services.auth_service import require_admin
from app.services.sessions_service import (
    close_session_with_image,
    get_session_image_url,
    get_sessions,
)

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])


@router.get(
    "/", response_model=PaginatedSessions, dependencies=[Depends(require_admin)]
)
def list_sessions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return get_sessions(db, page, page_size)


@router.post("/{session_id}/close-image")
async def close_session_image(
    session_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    jpeg_data = await request.body()
    if not jpeg_data:
        raise HTTPException(status_code=400, detail="Empty image body")
    try:
        close_session_with_image(db, session_id, jpeg_data)
    except ValueError as exc:
        status = 409 if "already closed" in str(exc) else 404
        raise HTTPException(status_code=status, detail=str(exc))
    return {"ok": True}


@router.get("/{session_id}/image", dependencies=[Depends(require_admin)])
def get_session_image(
    session_id: int,
    db: Session = Depends(get_db),
):
    try:
        url = get_session_image_url(db, session_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return RedirectResponse(url=url)
