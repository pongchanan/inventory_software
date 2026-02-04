from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from typing import Dict, Any
from app.database import get_db
from app.models.loan import Loan
from app.models.user import User
from app.models.item import Item
from app.models.transaction import Transaction
from app.models.approval import Approval
from app.models.compartment import Compartment

router = APIRouter(prefix="/api/stats", tags=["statistics"])


@router.get("/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get comprehensive dashboard statistics"""
    
    # Total counts
    total_users = db.query(func.count(User.id)).scalar()
    total_items = db.query(func.count(Item.id)).scalar()
    total_transactions = db.query(func.count(Transaction.id)).scalar()
    
    # Active loans
    active_loans = db.query(func.count(Loan.id)).filter(
        Loan.status == "active"
    ).scalar()
    
    # Overdue loans
    overdue_loans = db.query(func.count(Loan.id)).filter(
        and_(
            Loan.status.in_(["active", "overdue"]),
            Loan.due_at < datetime.utcnow()
        )
    ).scalar()
    
    # Pending approvals
    pending_approvals = db.query(func.count(Approval.id)).filter(
        Approval.status == "pending"
    ).scalar()
    
    # Available items
    available_items = db.query(func.count(Item.id)).filter(
        Item.available == True
    ).scalar()
    
    # Borrowed items
    borrowed_items = db.query(func.count(Item.id)).filter(
        Item.available == False
    ).scalar()
    
    # Compartment stats
    available_compartments = db.query(func.count(Compartment.id)).filter(
        Compartment.status == "available"
    ).scalar() or 0
    
    occupied_compartments = db.query(func.count(Compartment.id)).filter(
        Compartment.status == "occupied"
    ).scalar() or 0
    
    # Recent activity (last 24 hours)
    yesterday = datetime.utcnow() - timedelta(days=1)
    recent_transactions = db.query(func.count(Transaction.id)).filter(
        Transaction.timestamp >= yesterday
    ).scalar()
    
    return {
        "users": {
            "total": total_users,
            "active": db.query(func.count(User.id)).filter(User.authorized == True).scalar()
        },
        "items": {
            "total": total_items,
            "available": available_items,
            "borrowed": borrowed_items
        },
        "loans": {
            "active": active_loans,
            "overdue": overdue_loans
        },
        "approvals": {
            "pending": pending_approvals
        },
        "compartments": {
            "available": available_compartments,
            "occupied": occupied_compartments
        },
        "activity": {
            "total_transactions": total_transactions,
            "recent_24h": recent_transactions
        }
    }


@router.get("/user/{user_uid}")
def get_user_stats(user_uid: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get statistics for a specific user"""
    
    # Verify user exists
    user = db.query(User).filter(User.uid == user_uid).first()
    if not user:
        return {"error": "User not found"}
    
    # Active loans
    active_loans_count = db.query(func.count(Loan.id)).filter(
        and_(Loan.user_uid == user_uid, Loan.status == "active")
    ).scalar()
    
    # Overdue loans
    overdue_count = db.query(func.count(Loan.id)).filter(
        and_(
            Loan.user_uid == user_uid,
            Loan.status.in_(["active", "overdue"]),
            Loan.due_at < datetime.utcnow()
        )
    ).scalar()
    
    # Total transactions
    total_transactions = db.query(func.count(Transaction.id)).filter(
        Transaction.user_uid == user_uid
    ).scalar()
    
    # Pending approvals
    pending_approvals = db.query(func.count(Approval.id)).filter(
        and_(Approval.user_uid == user_uid, Approval.status == "pending")
    ).scalar()
    
    return {
        "user": {
            "uid": user.uid,
            "name": user.name,
            "authorized": user.authorized
        },
        "loans": {
            "active": active_loans_count,
            "overdue": overdue_count
        },
        "transactions": {
            "total": total_transactions
        },
        "approvals": {
            "pending": pending_approvals
        }
    }


@router.get("/system-health")
def get_system_health(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get system health status"""
    
    # Calculate various health metrics
    total_compartments = db.query(func.count(Compartment.id)).scalar() or 0
    maintenance_compartments = db.query(func.count(Compartment.id)).filter(
        Compartment.status == "maintenance"
    ).scalar() or 0
    
    # Recent activity (last hour)
    last_hour = datetime.utcnow() - timedelta(hours=1)
    recent_activity = db.query(func.count(Transaction.id)).filter(
        Transaction.timestamp >= last_hour
    ).scalar()
    
    return {
        "status": "online",
        "database": "connected",
        "compartments": {
            "total": total_compartments,
            "operational": total_compartments - maintenance_compartments,
            "maintenance": maintenance_compartments
        },
        "activity": {
            "last_hour": recent_activity,
            "status": "active" if recent_activity > 0 else "idle"
        },
        "timestamp": datetime.utcnow().isoformat()
    }
