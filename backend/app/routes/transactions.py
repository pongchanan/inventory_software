from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.item import Item
from app.models.item_type import ItemType
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionResponse

router = APIRouter(prefix="/api/transactions", tags=["transactions"])

ALLOWED_ACTIONS = {
    "borrow",
    "return",
    "adjustment",
    "unknown_change",
    "manual_resolution",
}


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    """
    Record a transaction from kiosk.
    Called when user scans items in/out of cabinet.
    """
    if transaction.action not in ALLOWED_ACTIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported action '{transaction.action}'. Allowed: {sorted(ALLOWED_ACTIONS)}",
        )

    user = db.query(User).filter(User.uid == transaction.user_uid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {transaction.user_uid} not found",
        )

    if transaction.item_uid:
        item = db.query(Item).filter(Item.uid == transaction.item_uid).first()
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Item {transaction.item_uid} not found",
            )

    if transaction.item_type_id is not None:
        item_type = db.query(ItemType).filter(ItemType.id == transaction.item_type_id).first()
        if not item_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Item type {transaction.item_type_id} not found",
            )

    payload = transaction.model_dump()
    # Keep legacy column compatibility for historical consumers.
    if not payload.get("item_uid") and payload.get("item_type_id") is not None:
        payload["item_uid"] = f"ITEM_TYPE:{payload['item_type_id']}"

    db_transaction = Transaction(**payload)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


@router.get("/", response_model=List[TransactionResponse])
def list_transactions(
    skip: int = 0,
    limit: int = 100,
    user_uid: Optional[str] = None,
    item_uid: Optional[str] = None,
    item_type_id: Optional[int] = None,
    slot_id: Optional[int] = None,
    action: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List transactions with optional filtering"""
    query = db.query(Transaction)
    
    if user_uid:
        query = query.filter(Transaction.user_uid == user_uid)
    
    if item_uid:
        query = query.filter(Transaction.item_uid == item_uid)

    if item_type_id is not None:
        query = query.filter(Transaction.item_type_id == item_type_id)

    if slot_id is not None:
        query = query.filter(Transaction.slot_id == slot_id)
    
    if action:
        query = query.filter(Transaction.action == action)
    
    transactions = query.order_by(Transaction.timestamp.desc()).offset(skip).limit(limit).all()
    return transactions


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Get a specific transaction by ID"""
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction {transaction_id} not found"
        )
    return transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Delete a transaction"""
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction {transaction_id} not found"
        )
    
    db.delete(transaction)
    db.commit()
    return None
