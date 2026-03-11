from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.models.loan import Loan
from app.models.user import User
from app.models.item import Item
from app.models.item_type import ItemType
from app.schemas.loan import LoanCreate, LoanResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/loans", tags=["loans"])

ALLOWED_SOURCE_ACTIONS = {
    "borrow",
    "return",
    "adjustment",
    "unknown_change",
    "manual_resolution",
}


class LoanDetail(BaseModel):
    id: int
    user_uid: str
    user_name: str
    user_email: Optional[str]
    item_uid: Optional[str]
    item_type_id: Optional[int]
    item_type_name: Optional[str]
    quantity: int
    slot_id: Optional[int]
    source_action: str
    item_name: str
    item_category: Optional[str]
    item_image_url: Optional[str]
    borrowed_at: datetime
    due_at: Optional[datetime]
    returned_at: Optional[datetime]
    status: str

    class Config:
        from_attributes = True


@router.post("/", response_model=LoanResponse, status_code=status.HTTP_201_CREATED)
def create_loan(loan: LoanCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.uid == loan.user_uid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {loan.user_uid} not found"
        )

    if loan.source_action not in ALLOWED_SOURCE_ACTIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported source_action '{loan.source_action}'. Allowed: {sorted(ALLOWED_SOURCE_ACTIONS)}",
        )

    item = None
    if loan.item_uid:
        item = db.query(Item).filter(Item.uid == loan.item_uid).first()
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Item {loan.item_uid} not found"
            )

    if loan.item_type_id is not None:
        item_type = db.query(ItemType).filter(ItemType.id == loan.item_type_id).first()
        if not item_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Item type {loan.item_type_id} not found"
            )

    # Legacy exclusivity check remains only for per-item UID loans.
    if loan.item_uid:
        active_loan = db.query(Loan).filter(
            and_(Loan.item_uid == loan.item_uid, Loan.status == "active")
        ).first()
        if active_loan:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Item is already borrowed"
            )

    payload = loan.model_dump()
    if not payload.get("item_uid") and payload.get("item_type_id") is not None:
        payload["item_uid"] = f"ITEM_TYPE:{payload['item_type_id']}"

    if payload.get("due_at") is None and payload.get("source_action") == "borrow":
        payload["due_at"] = datetime.utcnow() + timedelta(days=7)

    db_loan = Loan(**payload)
    db.add(db_loan)

    if item and loan.source_action == "borrow":
        item.available = False

    db.commit()
    db.refresh(db_loan)
    return db_loan


@router.get("/active", response_model=List[LoanResponse])
def get_active_loans(
    user_uid: Optional[str] = None,
    item_type_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Loan).filter(Loan.status == "active")
    if user_uid:
        query = query.filter(Loan.user_uid == user_uid)
    if item_type_id is not None:
        query = query.filter(Loan.item_type_id == item_type_id)

    loans = query.order_by(Loan.due_at).all()

    for loan in loans:
        if loan.due_at and loan.due_at < datetime.utcnow() and loan.status == "active":
            loan.status = "overdue"
    db.commit()
    return loans


@router.get("/overdue", response_model=List[LoanResponse])
def get_overdue_loans(db: Session = Depends(get_db)):
    loans = db.query(Loan).filter(
        and_(
            Loan.status.in_(["active", "overdue"]),
            Loan.due_at.isnot(None),
            Loan.due_at < datetime.utcnow()
        )
    ).all()

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
    query = db.query(Loan).filter(Loan.user_uid == user_uid)
    if not include_returned:
        query = query.filter(Loan.status.in_(["active", "overdue"]))
    return query.order_by(Loan.borrowed_at.desc()).all()


@router.post("/{loan_id}/return", response_model=LoanResponse)
def return_loan(loan_id: int, db: Session = Depends(get_db)):
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Loan {loan_id} not found"
        )

    loan.status = "returned"
    loan.returned_at = datetime.utcnow()

    # Only legacy per-item loans can toggle item.available reliably.
    if loan.item_uid and not str(loan.item_uid).startswith("ITEM_TYPE:"):
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
    item_type_id: Optional[int] = None,
    source_action: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Loan)
    if status_filter:
        query = query.filter(Loan.status == status_filter)
    if item_type_id is not None:
        query = query.filter(Loan.item_type_id == item_type_id)
    if source_action:
        query = query.filter(Loan.source_action == source_action)
    return query.order_by(Loan.borrowed_at.desc()).offset(skip).limit(limit).all()


@router.get("/{loan_id}", response_model=LoanResponse)
def get_loan(loan_id: int, db: Session = Depends(get_db)):
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Loan {loan_id} not found"
        )
    return loan


@router.get("/details/all", response_model=List[LoanDetail])
def get_all_loan_details(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    item_type_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Loan)
    if status_filter:
        query = query.filter(Loan.status == status_filter)
    if item_type_id is not None:
        query = query.filter(Loan.item_type_id == item_type_id)

    loans = query.order_by(Loan.borrowed_at.desc()).offset(skip).limit(limit).all()

    loan_details = []
    for loan in loans:
        user = db.query(User).filter(User.uid == loan.user_uid).first()
        item = db.query(Item).filter(Item.uid == loan.item_uid).first()
        item_type = db.query(ItemType).filter(ItemType.id == loan.item_type_id).first() if loan.item_type_id else None

        loan_details.append(LoanDetail(
            id=loan.id,
            user_uid=loan.user_uid,
            user_name=user.name if user else "Unknown User",
            user_email=user.email if user else None,
            item_uid=loan.item_uid,
            item_type_id=loan.item_type_id,
            item_type_name=item_type.name if item_type else None,
            quantity=loan.quantity,
            slot_id=loan.slot_id,
            source_action=loan.source_action,
            item_name=item.name if item else (item_type.name if item_type else "Unknown Item"),
            item_category=item.category if item else (item_type.category if item_type else None),
            item_image_url=item.image_url if item else None,
            borrowed_at=loan.borrowed_at,
            due_at=loan.due_at,
            returned_at=loan.returned_at,
            status=loan.status
        ))
    return loan_details


@router.get("/details/active", response_model=List[LoanDetail])
def get_active_loan_details(
    user_uid: Optional[str] = None,
    item_type_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Loan).filter(Loan.status == "active")
    if user_uid:
        query = query.filter(Loan.user_uid == user_uid)
    if item_type_id is not None:
        query = query.filter(Loan.item_type_id == item_type_id)

    loans = query.order_by(Loan.due_at).all()

    for loan in loans:
        if loan.due_at and loan.due_at < datetime.utcnow() and loan.status == "active":
            loan.status = "overdue"
    db.commit()

    loan_details = []
    for loan in loans:
        user = db.query(User).filter(User.uid == loan.user_uid).first()
        item = db.query(Item).filter(Item.uid == loan.item_uid).first()
        item_type = db.query(ItemType).filter(ItemType.id == loan.item_type_id).first() if loan.item_type_id else None

        loan_details.append(LoanDetail(
            id=loan.id,
            user_uid=loan.user_uid,
            user_name=user.name if user else "Unknown User",
            user_email=user.email if user else None,
            item_uid=loan.item_uid,
            item_type_id=loan.item_type_id,
            item_type_name=item_type.name if item_type else None,
            quantity=loan.quantity,
            slot_id=loan.slot_id,
            source_action=loan.source_action,
            item_name=item.name if item else (item_type.name if item_type else "Unknown Item"),
            item_category=item.category if item else (item_type.category if item_type else None),
            item_image_url=item.image_url if item else None,
            borrowed_at=loan.borrowed_at,
            due_at=loan.due_at,
            returned_at=loan.returned_at,
            status=loan.status
        ))
    return loan_details


@router.get("/details/user/{user_uid}", response_model=List[LoanDetail])
def get_user_loan_details(
    user_uid: str,
    include_returned: bool = True,
    db: Session = Depends(get_db)
):
    """Get detailed loan history for a specific user"""
    query = db.query(Loan).filter(Loan.user_uid == user_uid)

    if not include_returned:
        query = query.filter(Loan.status.in_(["active", "overdue"]))

    loans = query.order_by(Loan.borrowed_at.desc()).all()

    loan_details = []
    for loan in loans:
        user = db.query(User).filter(User.uid == loan.user_uid).first()
        item = db.query(Item).filter(Item.uid == loan.item_uid).first()
        item_type = db.query(ItemType).filter(ItemType.id == loan.item_type_id).first() if loan.item_type_id else None

        loan_details.append(LoanDetail(
            id=loan.id,
            user_uid=loan.user_uid,
            user_name=user.name if user else "Unknown User",
            user_email=user.email if user else None,
            item_uid=loan.item_uid,
            item_type_id=loan.item_type_id,
            item_type_name=item_type.name if item_type else None,
            quantity=loan.quantity,
            slot_id=loan.slot_id,
            source_action=loan.source_action,
            item_name=item.name if item else (item_type.name if item_type else "Unknown Item"),
            item_category=item.category if item else (item_type.category if item_type else None),
            item_image_url=item.image_url if item else None,
            borrowed_at=loan.borrowed_at,
            due_at=loan.due_at,
            returned_at=loan.returned_at,
            status=loan.status
        ))

    return loan_details
