from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., description="Message text")


class RecommendedItem(BaseModel):
    id: int
    name: str
    quantity: int
    image_url: Optional[str] = None
    in_stock: bool
    reason: Optional[str] = None


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Student query or prompt")
    history: list[ChatMessage] = Field(default_factory=list, description="Recent conversation messages")


class ChatResponse(BaseModel):
    reply: str = Field(..., description="Assistant markdown answer")
    recommended_items: list[RecommendedItem] = Field(default_factory=list, description="Related components found in inventory")
    suggested_queries: list[str] = Field(default_factory=list, description="Follow-up suggestion chips")

