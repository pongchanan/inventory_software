from __future__ import annotations

import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import process_chat_query

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["AI Assistant"])


@router.post("", response_model=ChatResponse)
@router.post("/", response_model=ChatResponse)
def chat_with_assistant(
    request: ChatRequest,
    db: Session = Depends(get_db),
) -> ChatResponse:
    """Chat with the AI Laboratory Assistant.
    
    Translates functional queries into specific hardware parts, provides wiring/pinout
    recommendations, and checks real-time availability in the smart cabinet inventory.
    """
    logger.info("[chat_route] Received query: %r (history_length=%d)", request.message, len(request.history))
    return process_chat_query(db, request)

