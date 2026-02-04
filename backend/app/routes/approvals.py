from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.approval import Approval
from app.schemas.approval import ApprovalCreate, ApprovalResponse, ApprovalUpdate

router = APIRouter(prefix="/api/approvals", tags=["approvals"])


@router.post("/", response_model=ApprovalResponse, status_code=status.HTTP_201_CREATED)
def create_approval_request(approval: ApprovalCreate, db: Session = Depends(get_db)):
    """Submit a new approval request for high-value item"""
    db_approval = Approval(**approval.model_dump())
    db.add(db_approval)
    db.commit()
    db.refresh(db_approval)
    return db_approval


@router.get("/pending", response_model=List[ApprovalResponse])
def get_pending_approvals(db: Session = Depends(get_db)):
    """Get all pending approval requests"""
    approvals = db.query(Approval).filter(
        Approval.status == "pending"
    ).order_by(
        Approval.priority.desc(),
        Approval.requested_at
    ).all()
    return approvals


@router.post("/{approval_id}/approve", response_model=ApprovalResponse)
def approve_request(
    approval_id: int,
    admin_uid: str,
    admin_notes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Approve a pending request"""
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Approval {approval_id} not found"
        )
    
    if approval.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Approval already processed"
        )
    
    approval.status = "approved"
    approval.admin_uid = admin_uid
    approval.resolved_at = datetime.utcnow()
    approval.admin_notes = admin_notes
    
    db.commit()
    db.refresh(approval)
    return approval


@router.post("/{approval_id}/reject", response_model=ApprovalResponse)
def reject_request(
    approval_id: int,
    admin_uid: str,
    admin_notes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Reject a pending request"""
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Approval {approval_id} not found"
        )
    
    if approval.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Approval already processed"
        )
    
    approval.status = "rejected"
    approval.admin_uid = admin_uid
    approval.resolved_at = datetime.utcnow()
    approval.admin_notes = admin_notes
    
    db.commit()
    db.refresh(approval)
    return approval


@router.get("/", response_model=List[ApprovalResponse])
def list_approvals(
    status_filter: Optional[str] = None,
    user_uid: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all approval requests with filtering"""
    query = db.query(Approval)
    
    if status_filter:
        query = query.filter(Approval.status == status_filter)
    
    if user_uid:
        query = query.filter(Approval.user_uid == user_uid)
    
    return query.order_by(Approval.requested_at.desc()).offset(skip).limit(limit).all()


@router.get("/{approval_id}", response_model=ApprovalResponse)
def get_approval(approval_id: int, db: Session = Depends(get_db)):
    """Get a specific approval request"""
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Approval {approval_id} not found"
        )
    return approval
