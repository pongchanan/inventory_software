"""Email service for sending notifications."""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import logging

from app.models.user import User
from app.models.inventory_event_core import InventoryEvent
from app.models.item_type_core import ItemType

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via SMTP."""
    
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.sender_email = os.getenv("SENDER_EMAIL")
        self.sender_password = os.getenv("SENDER_PASSWORD")
        self.sender_name = os.getenv("SENDER_NAME", "Inventory System")
        self.enabled = bool(self.sender_email and self.sender_password)
    
    def send_email(
        self,
        recipient_email: str,
        subject: str,
        body_text: str,
        body_html: Optional[str] = None
    ) -> bool:
        """
        Send an email using SMTP.
        
        Args:
            recipient_email: Recipient's email address
            subject: Email subject
            body_text: Plain text email body
            body_html: Optional HTML email body
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        if not self.enabled:
            logger.warning("Email service not configured. Skipping email to %s", recipient_email)
            return False
        
        try:
            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.sender_name} <{self.sender_email}>"
            msg["To"] = recipient_email
            
            # Attach plain text part
            part_text = MIMEText(body_text, "plain")
            msg.attach(part_text)
            
            # Attach HTML part if provided
            if body_html:
                part_html = MIMEText(body_html, "html")
                msg.attach(part_html)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.send_message(msg)
            
            logger.info("Email sent successfully to %s", recipient_email)
            return True
            
        except Exception as e:
            logger.error("Failed to send email to %s: %s", recipient_email, str(e))
            return False
    
    def send_late_item_reminder(
        self,
        user: User,
        overdue_loans: List[dict]
    ) -> bool:
        """
        Send email reminder for late items.
        
        Args:
            user: User object
            overdue_loans: List of overdue loan details
            
        Returns:
            bool: True if email sent successfully
        """
        if not user.email:
            logger.warning("User %s has no email address", user.id)
            return False
        
        # Build item list
        items_str = "\n".join([
            f"  - {loan['item_name']} (Due: {loan['due_date']}, {loan['days_overdue']} days overdue)"
            for loan in overdue_loans
        ])
        
        subject = "Reminder: You have overdue items to return"
        
        body_text = f"""Hi {user.name},

This is a friendly reminder that you have overdue items that need to be returned:

{items_str}

Please return these items as soon as possible.

Thank you,
{self.sender_name}"""
        
        body_html = f"""<html>
<body style="font-family: Arial, sans-serif; color: #333;">
    <h2>Reminder: Overdue Items</h2>
    <p>Hi {user.name},</p>
    <p>This is a friendly reminder that you have overdue items that need to be returned:</p>
    <ul style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #ff6b6b;">
        {"".join([
            f'<li><strong>{loan["item_name"]}</strong><br/>Due: {loan["due_date"]}<br/><span style="color: #ff6b6b;">({loan["days_overdue"]} days overdue)</span></li>'
            for loan in overdue_loans
        ])}
    </ul>
    <p style="color: #666;">Please return these items as soon as possible.</p>
    <p>Thank you,<br/>{self.sender_name}</p>
</body>
</html>"""
        
        return self.send_email(user.email, subject, body_text, body_html)
    
    def send_test_email(
        self,
        user: User,
        item_name: str = "Test Item",
        days_overdue: int = 5,
        is_test: bool = True
    ) -> bool:
        """
        Send a test email reminder to a user.
        
        Args:
            user: User object
            item_name: Name of the test item
            days_overdue: Number of days overdue for test item
            is_test: Whether this is a test email (adds [TEST] prefix)
            
        Returns:
            bool: True if email sent successfully
        """
        if not user.email:
            logger.warning("User %s has no email address", user.id)
            return False
        
        test_prefix = "[TEST] " if is_test else ""
        subject = f"{test_prefix}Reminder: You have overdue items to return"
        
        body_text = f"""Hi {user.name},

This is a friendly reminder that you have overdue items that need to be returned:

  - {item_name} ({days_overdue} days overdue)

Please return these items as soon as possible.

Thank you,
{self.sender_name}"""
        
        body_html = f"""<html>
<body style="font-family: Arial, sans-serif; color: #333;">
    <h2>Reminder: Overdue Items {test_prefix if is_test else ""}</h2>
    <p>Hi {user.name},</p>
    <p>This is a friendly reminder that you have overdue items that need to be returned:</p>
    <ul style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #ff6b6b;">
        <li><strong>{item_name}</strong><br/><span style="color: #ff6b6b;">({days_overdue} days overdue)</span></li>
    </ul>
    <p style="color: #666;">Please return these items as soon as possible.</p>
    <p>Thank you,<br/>{self.sender_name}</p>
</body>
</html>"""
        
        return self.send_email(user.email, subject, body_text, body_html)


def get_email_service() -> EmailService:
    """Factory function to get email service instance."""
    return EmailService()


def send_late_item_notifications(db: Session, user_id: Optional[int] = None) -> dict:
    """
    Send email notifications for all or specific user's overdue items.
    Creates both email and in-app notifications.
    
    Args:
        db: Database session
        user_id: Optional specific user to send to. If None, sends to all with overdue items.
        
    Returns:
        dict: Summary of notification results
    """
    from app.services.inventory_service import get_unit_occupancies
    from app.repositories.loan_repository import get_overdue_loans
    from app.repositories.notification_repository import NotificationRepository
    
    email_service = get_email_service()
    
    if not email_service.enabled:
        return {"status": "disabled", "message": "Email service not configured"}
    
    # Get users to process
    query = db.query(User).filter(User.active == True, User.email.isnot(None))
    if user_id:
        query = query.filter(User.id == user_id)
    
    users = query.all()
    
    results = {
        "total_users_checked": len(users),
        "emails_sent": 0,
        "notifications_created": 0,
        "users_with_overdue": [],
        "errors": []
    }
    
    for user in users:
        # Get overdue loans for this user
        overdue_loans = get_overdue_loans(db, user.id)
        
        if not overdue_loans:
            continue
        
        results["users_with_overdue"].append({
            "user_id": user.id,
            "user_name": user.name,
            "user_email": user.email,
            "overdue_count": len(overdue_loans)
        })
        
        # Send email
        success = email_service.send_late_item_reminder(user, overdue_loans)
        if success:
            results["emails_sent"] += 1
            
            # Create in-app notification
            items_list = ", ".join([loan['item_name'] for loan in overdue_loans])
            NotificationRepository.create_notification(
                db=db,
                user_id=user.id,
                title="Overdue Items Reminder",
                message=f"You have {len(overdue_loans)} overdue item(s): {items_list}",
                notification_type="late_item"
            )
            results["notifications_created"] += 1
        else:
            results["errors"].append(f"Failed to send email to {user.name} ({user.email})")
    
    return results


def send_test_email_notification(
    db: Session,
    user_id: int,
    item_name: str = "Test Item",
    days_overdue: int = 5
) -> dict:
    """
    Send a test email notification to a specific user.
    Creates both email and in-app notification.
    
    Args:
        db: Database session
        user_id: User ID to send test email to
        item_name: Name of the test item
        days_overdue: Number of days overdue for test scenario
        
    Returns:
        dict: Result of test email send
    """
    from app.repositories.notification_repository import NotificationRepository
    
    email_service = get_email_service()
    
    if not email_service.enabled:
        return {"status": "disabled", "message": "Email service not configured"}
    
    # Get user
    user = db.query(User).filter(User.id == user_id, User.active == True).first()
    if not user:
        return {"status": "error", "message": f"User {user_id} not found"}
    
    if not user.email:
        return {"status": "error", "message": f"User {user.name} has no email address"}
    
    # Send test email
    success = email_service.send_test_email(
        user=user,
        item_name=item_name,
        days_overdue=days_overdue,
        is_test=True
    )
    
    if success:
        # Create in-app notification
        NotificationRepository.create_notification(
            db=db,
            user_id=user.id,
            title="[TEST] Overdue Items Reminder",
            message=f"Test notification: {item_name} is {days_overdue} days overdue",
            notification_type="late_item"
        )
        
        return {
            "status": "success",
            "message": f"Test email sent to {user.name} ({user.email})",
            "user_id": user.id,
            "user_name": user.name,
            "user_email": user.email,
            "item_name": item_name,
            "days_overdue": days_overdue,
            "notification_created": True
        }
    else:
        return {
            "status": "error",
            "message": f"Failed to send test email to {user.name} ({user.email})"
        }
