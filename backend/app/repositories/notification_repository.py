from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.notification_core import Notification
from app.models.user import User


class NotificationRepository:
    """Repository for managing user notifications"""

    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        notification_type: str = "system",
    ) -> Notification:
        """Create a new notification for a user"""
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notification_type,
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    @staticmethod
    def get_unread_notifications(db: Session, user_id: int, limit: int = 10) -> list:
        """Get unread notifications for a user, ordered by most recent"""
        return (
            db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read == False)
            .order_by(desc(Notification.created_at))
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_all_notifications(db: Session, user_id: int, limit: int = 50) -> list:
        """Get all notifications for a user, ordered by most recent"""
        return (
            db.query(Notification)
            .filter(Notification.user_id == user_id)
            .order_by(desc(Notification.created_at))
            .limit(limit)
            .all()
        )

    @staticmethod
    def mark_as_read(db: Session, notification_id: int) -> Notification:
        """Mark a notification as read"""
        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        if notification:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            db.commit()
            db.refresh(notification)
        return notification

    @staticmethod
    def mark_all_as_read(db: Session, user_id: int) -> int:
        """Mark all unread notifications as read for a user"""
        notifications = (
            db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read == False)
            .all()
        )
        count = 0
        for notification in notifications:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            count += 1
        db.commit()
        return count

    @staticmethod
    def get_unread_count(db: Session, user_id: int) -> int:
        """Get count of unread notifications for a user"""
        return (
            db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read == False)
            .count()
        )

    @staticmethod
    def delete_notification(db: Session, notification_id: int) -> bool:
        """Delete a notification"""
        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        if notification:
            db.delete(notification)
            db.commit()
            return True
        return False

    @staticmethod
    def delete_all_notifications(db: Session, user_id: int) -> int:
        """Delete all notifications for a user"""
        notifications = db.query(Notification).filter(Notification.user_id == user_id).all()
        count = len(notifications)
        for notification in notifications:
            db.delete(notification)
        db.commit()
        return count
