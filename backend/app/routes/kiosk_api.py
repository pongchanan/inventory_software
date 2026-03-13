from fastapi import APIRouter

from app.services.audit_logs_service import get_kiosk_status, list_kiosk_status


router = APIRouter(prefix="/api/kiosk", tags=["kiosk"])


@router.get("/status")
def kiosk_status_list():
    return list_kiosk_status()


@router.get("/status/{kiosk_id}")
def kiosk_status_detail(kiosk_id: str):
    return get_kiosk_status(kiosk_id)
