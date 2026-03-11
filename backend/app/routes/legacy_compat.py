from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db


router = APIRouter(tags=["legacy-compat"])


class LegacyItemResponse(BaseModel):
    id: int
    uid: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    quantity: int
    available: bool
    location: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class LegacyLoanResponse(BaseModel):
    id: int
    user_uid: str
    item_uid: str
    borrowed_at: datetime
    due_at: Optional[datetime] = None
    returned_at: Optional[datetime] = None
    status: str


class LegacyLoanDetailResponse(BaseModel):
    id: int
    user_uid: str
    user_name: str
    user_email: Optional[str] = None
    item_uid: Optional[str] = None
    item_name: str
    item_category: Optional[str] = None
    item_image_url: Optional[str] = None
    borrowed_at: datetime
    due_at: Optional[datetime] = None
    returned_at: Optional[datetime] = None
    status: str


def _table_exists(db: Session, table_name: str) -> bool:
    return bool(db.execute(text("SELECT to_regclass(:name)"), {"name": f"public.{table_name}"}).scalar())


def _normalize_loan_status(status: Optional[str], due_at: Optional[datetime], returned_at: Optional[datetime]) -> str:
    if returned_at is not None:
        return "returned"
    if due_at is not None and due_at < datetime.utcnow():
        return "overdue"
    return status or "active"


def _map_item_row(row: Dict[str, Any]) -> Dict[str, Any]:
    quantity = max(int(row.get("quantity") or 0), 0)
    return {
        "id": int(row["id"]),
        "uid": str(row["uid"]),
        "name": str(row["name"]),
        "description": row.get("description"),
        "category": row.get("category"),
        "quantity": quantity,
        "available": bool(row.get("available", quantity > 0)),
        "location": row.get("location"),
        "image_url": row.get("image_url"),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def _catalog_items(db: Session) -> List[Dict[str, Any]]:
    if _table_exists(db, "item_types"):
        rows = db.execute(
            text(
                """
                SELECT
                    it.id,
                    'ITEMTYPE-' || it.id::text AS uid,
                    it.name,
                    lit.description,
                    lit.category,
                    COALESCE(stock.available_count, 1) AS quantity,
                    COALESCE(stock.available_count, 1) > 0 AS available,
                    COALESCE(lit.category, 'Smart Inventory') AS location,
                    img.image_url,
                    it.created_at,
                    it.updated_at
                FROM public.item_types it
                LEFT JOIN public.legacy_item_types lit ON lit.id = it.id
                LEFT JOIN LATERAL (
                    SELECT image_url
                    FROM public.item_type_images
                    WHERE item_type_id = it.id
                    ORDER BY is_primary DESC, id ASC
                    LIMIT 1
                ) img ON TRUE
                LEFT JOIN LATERAL (
                    SELECT GREATEST(1 - COUNT(*) FILTER (WHERE status IN ('active', 'overdue')), 0) AS available_count
                    FROM public.legacy_loans ll
                    WHERE ll.item_type_id = it.id
                ) stock ON TRUE
                WHERE COALESCE(it.active, TRUE) = TRUE
                ORDER BY it.name ASC
                """
            )
        ).mappings().all()
        if rows:
            return [_map_item_row(dict(row)) for row in rows]

    if _table_exists(db, "legacy_items"):
        rows = db.execute(
            text(
                """
                SELECT
                    id,
                    uid,
                    name,
                    NULL::text AS description,
                    category,
                    COALESCE(quantity, 0) AS quantity,
                    COALESCE(available, FALSE) AS available,
                    location,
                    image_url,
                    created_at,
                    updated_at
                FROM public.legacy_items
                ORDER BY name ASC
                """
            )
        ).mappings().all()
        return [_map_item_row(dict(row)) for row in rows]

    return []


def _loan_rows(db: Session, where_sql: str = "", params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    if not _table_exists(db, "legacy_loans"):
        return []

    sql = f"""
        SELECT
            ll.id,
            ll.user_uid,
            lu.name AS user_name,
            lu.email AS user_email,
            ll.item_uid,
            COALESCE(li.name, lit.name, ll.item_uid, 'Unknown Item') AS item_name,
            COALESCE(li.category, lit.category) AS item_category,
            li.image_url AS item_image_url,
            ll.borrowed_at,
            ll.due_at,
            ll.returned_at,
            ll.status
        FROM public.legacy_loans ll
        LEFT JOIN public.legacy_users lu ON lu.uid = ll.user_uid
        LEFT JOIN public.legacy_items li ON li.uid = ll.item_uid
        LEFT JOIN public.legacy_item_types lit ON lit.id = ll.item_type_id
        {where_sql}
        ORDER BY ll.borrowed_at DESC, ll.id DESC
    """
    return [dict(row) for row in db.execute(text(sql), params or {}).mappings().all()]


def _map_loan_summary(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": int(row["id"]),
        "user_uid": str(row["user_uid"]),
        "item_uid": str(row.get("item_uid") or ""),
        "borrowed_at": row["borrowed_at"],
        "due_at": row.get("due_at"),
        "returned_at": row.get("returned_at"),
        "status": _normalize_loan_status(row.get("status"), row.get("due_at"), row.get("returned_at")),
    }


def _map_loan_detail(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": int(row["id"]),
        "user_uid": str(row["user_uid"]),
        "user_name": row.get("user_name") or "Unknown User",
        "user_email": row.get("user_email"),
        "item_uid": row.get("item_uid"),
        "item_name": row.get("item_name") or "Unknown Item",
        "item_category": row.get("item_category"),
        "item_image_url": row.get("item_image_url"),
        "borrowed_at": row["borrowed_at"],
        "due_at": row.get("due_at"),
        "returned_at": row.get("returned_at"),
        "status": _normalize_loan_status(row.get("status"), row.get("due_at"), row.get("returned_at")),
    }


@router.get("/api/items/", response_model=List[LegacyItemResponse])
@router.get("/api/items", response_model=List[LegacyItemResponse], include_in_schema=False)
def list_legacy_items(
    available: Optional[bool] = Query(default=None),
    db: Session = Depends(get_db),
):
    items = _catalog_items(db)
    if available is not None:
        items = [item for item in items if item["available"] is available]
    return items


@router.get("/api/items/{uid}", response_model=LegacyItemResponse)
def get_legacy_item(uid: str, db: Session = Depends(get_db)):
    items = _catalog_items(db)
    item = next((entry for entry in items if entry["uid"] == uid), None)
    if item is None:
        raise HTTPException(status_code=404, detail=f"Item {uid} not found")
    return item


@router.get("/api/items/{uid}/image-url")
def get_legacy_item_image(uid: str, request: Request, db: Session = Depends(get_db)):
    item = get_legacy_item(uid, db)
    if not item["image_url"]:
        raise HTTPException(status_code=404, detail="This item has no image")
    image_url = item["image_url"]
    if image_url.startswith("/"):
        base_url = str(request.base_url).rstrip("/")
        return {"url": f"{base_url}{image_url}"}
    return {"url": image_url}


@router.get("/api/loans/", response_model=List[LegacyLoanResponse])
@router.get("/api/loans", response_model=List[LegacyLoanResponse], include_in_schema=False)
def list_legacy_loans(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
):
    where_parts = []
    params: Dict[str, Any] = {}
    if status_filter:
        where_parts.append("ll.status = :status_filter")
        params["status_filter"] = status_filter
    where_sql = f"WHERE {' AND '.join(where_parts)}" if where_parts else ""
    return [_map_loan_summary(row) for row in _loan_rows(db, where_sql, params)]


@router.get("/api/loans/active", response_model=List[LegacyLoanResponse])
def list_legacy_active_loans(
    user_uid: Optional[str] = None,
    db: Session = Depends(get_db),
):
    where_parts = ["ll.status IN ('active', 'overdue')"]
    params: Dict[str, Any] = {}
    if user_uid:
        where_parts.append("ll.user_uid = :user_uid")
        params["user_uid"] = user_uid
    where_sql = f"WHERE {' AND '.join(where_parts)}"
    return [_map_loan_summary(row) for row in _loan_rows(db, where_sql, params)]


@router.get("/api/loans/overdue", response_model=List[LegacyLoanResponse])
def list_legacy_overdue_loans(db: Session = Depends(get_db)):
    return [
        _map_loan_summary(row)
        for row in _loan_rows(db, "WHERE ll.status = 'overdue' OR (ll.returned_at IS NULL AND ll.due_at < NOW())")
    ]


@router.get("/api/loans/user/{user_uid}", response_model=List[LegacyLoanResponse])
def list_legacy_user_loans(
    user_uid: str,
    include_returned: bool = False,
    db: Session = Depends(get_db),
):
    where_parts = ["ll.user_uid = :user_uid"]
    params: Dict[str, Any] = {"user_uid": user_uid}
    if not include_returned:
        where_parts.append("ll.status IN ('active', 'overdue')")
    where_sql = f"WHERE {' AND '.join(where_parts)}"
    return [_map_loan_summary(row) for row in _loan_rows(db, where_sql, params)]


@router.get("/api/loans/details/all", response_model=List[LegacyLoanDetailResponse])
def list_legacy_loan_details(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
):
    where_parts = []
    params: Dict[str, Any] = {}
    if status_filter:
        where_parts.append("ll.status = :status_filter")
        params["status_filter"] = status_filter
    where_sql = f"WHERE {' AND '.join(where_parts)}" if where_parts else ""
    return [_map_loan_detail(row) for row in _loan_rows(db, where_sql, params)]


@router.get("/api/loans/details/active", response_model=List[LegacyLoanDetailResponse])
def list_legacy_active_loan_details(
    user_uid: Optional[str] = None,
    db: Session = Depends(get_db),
):
    where_parts = ["ll.status IN ('active', 'overdue')"]
    params: Dict[str, Any] = {}
    if user_uid:
        where_parts.append("ll.user_uid = :user_uid")
        params["user_uid"] = user_uid
    where_sql = f"WHERE {' AND '.join(where_parts)}"
    return [_map_loan_detail(row) for row in _loan_rows(db, where_sql, params)]


@router.get("/api/loans/details/user/{user_uid}", response_model=List[LegacyLoanDetailResponse])
def list_legacy_user_loan_details(
    user_uid: str,
    include_returned: bool = True,
    db: Session = Depends(get_db),
):
    where_parts = ["ll.user_uid = :user_uid"]
    params: Dict[str, Any] = {"user_uid": user_uid}
    if not include_returned:
        where_parts.append("ll.status IN ('active', 'overdue')")
    where_sql = f"WHERE {' AND '.join(where_parts)}"
    return [_map_loan_detail(row) for row in _loan_rows(db, where_sql, params)]