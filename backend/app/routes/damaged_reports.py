from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import RedirectResponse, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.damaged_item_report import DamagedItemReportOut
from app.services.auth_service import get_current_user, require_admin
from app.services.damaged_report_service import (
    create_admin_report,
    create_user_report,
    export_reports_excel,
    get_all_reports,
    get_report_image_url,
    get_reports_by_user,
)

router = APIRouter(prefix="/api/damaged-reports", tags=["Damaged Reports"])


@router.get(
    "/",
    response_model=list[DamagedItemReportOut],
    dependencies=[Depends(require_admin)],
)
def list_all_reports(db: Session = Depends(get_db)):
    return get_all_reports(db)


@router.get("/me", response_model=list[DamagedItemReportOut])
def my_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_reports_by_user(db, current_user.id)


@router.get(
    "/user/{user_id}",
    response_model=list[DamagedItemReportOut],
    dependencies=[Depends(require_admin)],
)
def user_reports(user_id: int, db: Session = Depends(get_db)):
    return get_reports_by_user(db, user_id)


@router.get("/export", dependencies=[Depends(require_admin)])
def export_excel(db: Session = Depends(get_db)):
    data = export_reports_excel(db)
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=damaged_reports.xlsx"},
    )


@router.get("/{report_id}/image")
def report_image(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        url = get_report_image_url(db, report_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return RedirectResponse(url=url)


@router.post("/", response_model=DamagedItemReportOut)
async def submit_user_report(
    topic: str = Form(...),
    description: str = Form(...),
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    image_data = await image.read()
    try:
        return create_user_report(db, current_user.id, topic, description, image_data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post(
    "/admin", response_model=DamagedItemReportOut, dependencies=[Depends(require_admin)]
)
async def submit_admin_report(
    topic: str = Form(...),
    description: str = Form(...),
    item_id: int = Form(...),
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    image_data = await image.read()
    try:
        return create_admin_report(
            db, current_user.id, item_id, topic, description, image_data
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
