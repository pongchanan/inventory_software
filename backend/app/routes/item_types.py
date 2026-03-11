import os
import re
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import require_admin
from app.database import get_db
from app.models.item_type import ItemType
from app.models.item_type_image import ItemTypeImage
from app.models.user import User
from app.s3 import upload_file_to_s3, generate_presigned_url
from app.schemas.item_type import ItemTypeCreate, ItemTypeResponse
from app.schemas.item_type_image import ItemTypeImageResponse


router = APIRouter(prefix="/api/item-types", tags=["item-types"])


class ItemTypeDetailResponse(ItemTypeResponse):
    images: List[ItemTypeImageResponse] = []


class ItemTypeSimilaritySearchRequest(BaseModel):
    # query_text can be item label/name typed by admin, OCR output,
    # or metadata extracted from client before sending.
    query_text: Optional[str] = None
    # image_url can be provided to allow filename-token matching as a lightweight
    # fallback before full embedding search is integrated.
    image_url: Optional[str] = None
    top_k: int = 5


class ItemTypeSimilarityMatch(BaseModel):
    item_type_id: int
    code: str
    name: str
    category: Optional[str] = None
    score: float
    reason: str


class ItemTypeSimilaritySearchResponse(BaseModel):
    query: str
    top_k: int
    matches: List[ItemTypeSimilarityMatch]


def _serialize_item_type_images(images: List[ItemTypeImage]) -> List[ItemTypeImageResponse]:
    serialized: List[ItemTypeImageResponse] = []
    for img in images:
        image_url = img.image_url
        # New image entries store S3 keys; generate presigned URL for client use.
        # If someone stores a legacy absolute URL manually, leave it as-is.
        if image_url and not image_url.startswith("http://") and not image_url.startswith("https://"):
            image_url = generate_presigned_url(image_url, expires_in=3600)

        serialized.append(
            ItemTypeImageResponse(
                id=img.id,
                item_type_id=img.item_type_id,
                image_url=image_url,
                embedding_ref=img.embedding_ref,
                is_primary=img.is_primary,
                captured_view=img.captured_view,
                created_at=img.created_at,
            )
        )
    return serialized


def _tokenize(text: str) -> set[str]:
    if not text:
        return set()
    normalized = text.lower().replace("-", " ").replace("_", " ")
    return {tok for tok in re.split(r"[^a-z0-9]+", normalized) if len(tok) >= 2}


def _best_effort_similarity_score(query_tokens: set[str], item_type: ItemType, gallery_tokens: set[str]) -> tuple[float, str]:
    base_tokens = _tokenize(item_type.code)
    base_tokens |= _tokenize(item_type.name)
    if item_type.category:
        base_tokens |= _tokenize(item_type.category)
    if item_type.description:
        base_tokens |= _tokenize(item_type.description)

    all_tokens = base_tokens | gallery_tokens
    if not all_tokens or not query_tokens:
        return 0.0, "no-token-overlap"

    overlap = query_tokens & all_tokens
    score = len(overlap) / len(query_tokens)

    # Slight boost for code/name direct overlap to favor exact-type matches.
    key_overlap = query_tokens & (_tokenize(item_type.code) | _tokenize(item_type.name))
    if key_overlap:
        score += 0.15

    score = min(score, 1.0)
    reason = "token-overlap" if overlap else "no-overlap"
    return score, reason


@router.post("", response_model=ItemTypeResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ItemTypeResponse, status_code=status.HTTP_201_CREATED)
def create_item_type(
    payload: ItemTypeCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """POST /api/item-types

    Register a new item type (not per-serial item), e.g. ESP32 or NodeMCU.
    """
    existing = db.query(ItemType).filter(ItemType.code == payload.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Item type with code {payload.code} already exists",
        )

    obj = ItemType(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("", response_model=List[ItemTypeDetailResponse])
@router.get("/", response_model=List[ItemTypeDetailResponse])
def list_item_types(
    category: Optional[str] = None,
    active_only: bool = False,
    include_images: bool = True,
    db: Session = Depends(get_db),
):
    """GET /api/item-types

    Returns all registered item types with optional image gallery expansion.
    """
    query = db.query(ItemType)
    if category:
        query = query.filter(ItemType.category == category)
    if active_only:
        query = query.filter(ItemType.is_active.is_(True))

    item_types = query.order_by(ItemType.category, ItemType.name).all()

    if not include_images:
        return [
            ItemTypeDetailResponse(
                id=t.id,
                code=t.code,
                name=t.name,
                category=t.category,
                description=t.description,
                tracking_mode=t.tracking_mode,
                is_active=t.is_active,
                created_at=t.created_at,
                updated_at=t.updated_at,
                images=[],
            )
            for t in item_types
        ]

    type_ids = [t.id for t in item_types]
    images_by_type: dict[int, List[ItemTypeImage]] = {tid: [] for tid in type_ids}
    if type_ids:
        images = (
            db.query(ItemTypeImage)
            .filter(ItemTypeImage.item_type_id.in_(type_ids))
            .order_by(ItemTypeImage.item_type_id, ItemTypeImage.is_primary.desc(), ItemTypeImage.created_at.desc())
            .all()
        )
        for img in images:
            images_by_type.setdefault(img.item_type_id, []).append(img)

    return [
        ItemTypeDetailResponse(
            id=t.id,
            code=t.code,
            name=t.name,
            category=t.category,
            description=t.description,
            tracking_mode=t.tracking_mode,
            is_active=t.is_active,
            created_at=t.created_at,
            updated_at=t.updated_at,
            images=_serialize_item_type_images(images_by_type.get(t.id, [])),
        )
        for t in item_types
    ]


@router.post("/similarity/search", response_model=ItemTypeSimilaritySearchResponse)
def search_item_type_similarity(
    payload: ItemTypeSimilaritySearchRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """POST /api/item-types/similarity/search

    Placeholder search until embedding service is integrated.
    Scores by token overlap against item type metadata and gallery filenames.
    """
    top_k = max(1, min(payload.top_k, 20))

    raw_query = (payload.query_text or "").strip()
    if not raw_query and payload.image_url:
        filename = os.path.basename(payload.image_url)
        raw_query = filename

    if not raw_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide query_text or image_url for similarity search",
        )

    query_tokens = _tokenize(raw_query)
    if not query_tokens:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query does not contain searchable tokens",
        )

    item_types = db.query(ItemType).filter(ItemType.is_active.is_(True)).all()
    if not item_types:
        return ItemTypeSimilaritySearchResponse(query=raw_query, top_k=top_k, matches=[])

    type_ids = [it.id for it in item_types]
    images = (
        db.query(ItemTypeImage)
        .filter(ItemTypeImage.item_type_id.in_(type_ids))
        .all()
    )
    gallery_tokens_by_type: dict[int, set[str]] = {it.id: set() for it in item_types}
    for img in images:
        gallery_tokens_by_type.setdefault(img.item_type_id, set())
        gallery_tokens_by_type[img.item_type_id] |= _tokenize(img.image_url)
        if img.captured_view:
            gallery_tokens_by_type[img.item_type_id] |= _tokenize(img.captured_view)

    scored: List[ItemTypeSimilarityMatch] = []
    for it in item_types:
        score, reason = _best_effort_similarity_score(
            query_tokens=query_tokens,
            item_type=it,
            gallery_tokens=gallery_tokens_by_type.get(it.id, set()),
        )
        if score <= 0:
            continue
        scored.append(
            ItemTypeSimilarityMatch(
                item_type_id=it.id,
                code=it.code,
                name=it.name,
                category=it.category,
                score=round(score, 4),
                reason=reason,
            )
        )

    scored.sort(key=lambda x: x.score, reverse=True)
    return ItemTypeSimilaritySearchResponse(
        query=raw_query,
        top_k=top_k,
        matches=scored[:top_k],
    )


@router.get("/{item_type_id}", response_model=ItemTypeDetailResponse)
def get_item_type(item_type_id: int, db: Session = Depends(get_db)):
    """GET /api/item-types/{id}

    Return one item type with all reference images (gallery support).
    """
    item_type = db.query(ItemType).filter(ItemType.id == item_type_id).first()
    if not item_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item type {item_type_id} not found",
        )

    images = (
        db.query(ItemTypeImage)
        .filter(ItemTypeImage.item_type_id == item_type_id)
        .order_by(ItemTypeImage.is_primary.desc(), ItemTypeImage.created_at.desc())
        .all()
    )

    return ItemTypeDetailResponse(
        id=item_type.id,
        code=item_type.code,
        name=item_type.name,
        category=item_type.category,
        description=item_type.description,
        tracking_mode=item_type.tracking_mode,
        is_active=item_type.is_active,
        created_at=item_type.created_at,
        updated_at=item_type.updated_at,
        images=_serialize_item_type_images(images),
    )


@router.post("/{item_type_id}/images", response_model=ItemTypeImageResponse, status_code=status.HTTP_201_CREATED)
async def add_item_type_image(
    item_type_id: int,
    file: Optional[UploadFile] = File(default=None),
    image_url: Optional[str] = Form(default=None),
    captured_view: Optional[str] = Form(default=None),
    is_primary: bool = Form(default=False),
    embedding_ref: Optional[str] = Form(default=None),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """POST /api/item-types/{id}/images

    Add one reference image to an item type's gallery.
    Supports either:
      - multipart file upload (stored in S3), or
      - direct image_url form value.

    One item type can and should have multiple reference images.
    """
    item_type = db.query(ItemType).filter(ItemType.id == item_type_id).first()
    if not item_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item type {item_type_id} not found",
        )

    if not file and not image_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either image file or image_url",
        )

    stored_image_url = image_url
    if file is not None:
        file_ext = os.path.splitext(file.filename or "")[1].lower()
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty",
            )
        uid = f"itemtype_{item_type_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        stored_image_url = upload_file_to_s3(file_bytes, uid, file_ext)

    if is_primary:
        # Ensure only one primary image per item type.
        db.query(ItemTypeImage).filter(
            ItemTypeImage.item_type_id == item_type_id,
            ItemTypeImage.is_primary.is_(True),
        ).update({"is_primary": False}, synchronize_session=False)

    image = ItemTypeImage(
        item_type_id=item_type_id,
        image_url=stored_image_url,
        captured_view=captured_view,
        is_primary=is_primary,
        embedding_ref=embedding_ref,
    )
    db.add(image)
    db.commit()
    db.refresh(image)

    response_image_url = image.image_url
    if response_image_url and not response_image_url.startswith("http://") and not response_image_url.startswith("https://"):
        response_image_url = generate_presigned_url(response_image_url, expires_in=3600)

    return ItemTypeImageResponse(
        id=image.id,
        item_type_id=image.item_type_id,
        image_url=response_image_url,
        embedding_ref=image.embedding_ref,
        is_primary=image.is_primary,
        captured_view=image.captured_view,
        created_at=image.created_at,
    )
