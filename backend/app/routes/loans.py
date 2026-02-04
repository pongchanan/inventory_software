from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.loan import Loan
from app.models.user import User
from app.models.item import Item
from app.schemas.loan import LoanCreate, LoanResponse

router = APIRouter(prefix="/api/loans", tags=["loans"])


@router.post("/", response_model=LoanResponse, status_code=status.HTTP_201_CREATED)
def create_loan(loan: LoanCreate, db: Session = Depends(get_db)):
    """Create a new loan (borrow transaction)"""
    # Verify user exists
    user = db.query(User).filter(User.uid == loan.user_uid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {loan.user_uid} not found"
        )
    
    # Verify item exists
    item = db.query(Item).filter(Item.uid == loan.item_uid).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item {loan.item_uid} not found"
        )
    
    # Check if item is already borrowed
    active_loan = db.query(Loan).filter(
        and_(Loan.item_uid == loan.item_uid, Loan.status == "active")
    ).first()
    if active_loan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item is already borrowed"
        )
    
    db_loan = Loan(**loan.model_dump())
    db.add(db_loan)
    
    # Update item availability
    item.available = False
    
    db.commit()
    db.refresh(db_loan)
    return db_loan


@router.get("/active", response_model=List[LoanResponse])
def get_active_loans(
    user_uid: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all active loans, optionally filtered by user"""
    query = db.query(Loan).filter(Loan.status == "active")
    
    if user_uid:
        query = query.filter(Loan.user_uid == user_uid)
    
    loans = query.order_by(Loan.due_at).all()
    
    # Update overdue status
    for loan in loans:
        if loan.due_at < datetime.utcnow() and loan.status == "active":
            loan.status = "overdue"
    db.commit()
    
    return loans


@router.get("/overdue", response_model=List[LoanResponse])
def get_overdue_loans(db: Session = Depends(get_db)):
    """Get all overdue loans"""
    loans = db.query(Loan).filter(
        and_(
            Loan.status.in_(["active", "overdue"]),
            Loan.due_at < datetime.utcnow()
        )
    ).all()
    
    # Mark as overdue
    for loan in loans:
        loan.status = "overdue"
    db.commit()
    
    return loans


@router.get("/user/{user_uid}", response_model=List[LoanResponse])
def get_user_loans(
    user_uid: str,
    include_returned: bool = False,
    db: Session = Depends(get_db)
):
    """Get all loans for a specific user"""
    query = db.query(Loan).filter(Loan.user_uid == user_uid)
    
    if not include_returned:
        query = query.filter(Loan.status.in_(["active", "overdue"]))
    
    return query.order_by(Loan.borrowed_at.desc()).all()


@router.post("/{loan_id}/return", response_model=LoanResponse)
def return_loan(loan_id: int, db: Session = Depends(get_db)):
    """Mark a loan as returned"""
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Loan {loan_id} not found"
        )
    
    loan.status = "returned"
    loan.returned_at = datetime.utcnow()
    
    # Update item availability
    item = db.query(Item).filter(Item.uid == loan.item_uid).first()
    if item:
        item.available = True
    
    db.commit()
    db.refresh(loan)
    return loan


@router.get("/", response_model=List[LoanResponse])
def list_all_loans(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all loans with optional filtering"""
    query = db.query(Loan)
    
    if status_filter:
        query = query.filter(Loan.status == status_filter)
    
    return query.order_by(Loan.borrowed_at.desc()).offset(skip).limit(limit).all()


@router.get("/{loan_id}", response_model=LoanResponse)
def get_loan(loan_id: int, db: Session = Depends(get_db)):
    """Get a specific loan by ID"""
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Loan {loan_id} not found"
        )
    return loan
