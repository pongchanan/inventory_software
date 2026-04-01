from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.repositories.notification_repository import NotificationRepository
from app.schemas.notification_api import (
    NotificationResponse,
    NotificationListResponse,
    NotificationStatsResponse,
    NotificationCreate,
)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse)
def get_notifications(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all notifications for current user"""
    notifications = NotificationRepository.get_all_notifications(db, current_user.id, limit)
    unread_count = NotificationRepository.get_unread_count(db, current_user.id)
    
    return NotificationListResponse(
        notifications=notifications,
        unread_count=unread_count,
        total_count=len(notifications),
    )


@router.get("/unread", response_model=List[NotificationResponse])
def get_unread_notifications(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get unread notifications for current user"""
    return NotificationRepository.get_unread_notifications(db, current_user.id, limit)


@router.get("/stats", response_model=NotificationStatsResponse)
def get_notification_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get notification statistics (unread count, etc.)"""
    unread_count = NotificationRepository.get_unread_count(db, current_user.id)
    total_count = db.query(NotificationRepository).filter(
        NotificationRepository.user_id == current_user.id
    ).count()
    
    return NotificationStatsResponse(
        unread_count=unread_count,
        total_count=total_count,
    )


@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a notification as read"""
    from app.models.notification_core import Notification
    
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    
    return NotificationRepository.mark_as_read(db, notification_id)


@router.put("/read-all", response_model=dict)
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark all notifications as read"""
    count = NotificationRepository.mark_all_as_read(db, current_user.id)
    return {"message": f"{count} notifications marked as read"}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a notification"""
    from app.models.notification_core import Notification
    
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    
    NotificationRepository.delete_notification(db, notification_id)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_all_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete all notifications for current user"""
    NotificationRepository.delete_all_notifications(db, current_user.id)
