from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionResponse

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    """
    Record a transaction from kiosk.
    Called when user scans items in/out of cabinet.
    """
    db_transaction = Transaction(**transaction.model_dump())
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
    action: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List transactions with optional filtering"""
    query = db.query(Transaction)
    
    if user_uid:
        query = query.filter(Transaction.user_uid == user_uid)
    
    if item_uid:
        query = query.filter(Transaction.item_uid == item_uid)
    
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
