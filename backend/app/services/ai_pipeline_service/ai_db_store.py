from __future__ import annotations

from array import array
import hashlib
import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.models.ai_label import AiLabel
from app.models.ai_prototype import AiPrototype
from app.models.ai_sample import AiSample
from .ai_config import ensure_ai_runtime_dirs


def init_ai_store() -> None:
    """Ensure AI runtime directories exist. DB schema is managed by SQLAlchemy models."""
    ensure_ai_runtime_dirs()


def _vec_to_blob(vec: list[float]) -> bytes:
    return array("f", [float(value) for value in vec]).tobytes()


def _blob_to_vec(blob: bytes) -> list[float]:
    values = array("f")
    values.frombytes(blob)
    return [float(value) for value in values]


def image_hash_from_bytes(image_bytes: bytes) -> str:
    return hashlib.sha256(image_bytes).hexdigest()


def get_or_create_label_id(
    db: Session,
    label: str,
    item_id: int | None = None,
) -> int:
    clean_label = label.strip()
    if not clean_label:
        raise ValueError("label cannot be empty")

    row = db.query(AiLabel).filter(AiLabel.name == clean_label).first()
    if row is not None:
        if item_id is not None and row.item_id is None:
            row.item_id = item_id
            db.commit()
        return row.id

    new_label = AiLabel(name=clean_label, item_id=item_id)
    db.add(new_label)
    db.commit()
    db.refresh(new_label)
    return new_label.id


def sample_hash_exists(db: Session, image_hash: str) -> bool:
    return (
        db.query(AiSample.id).filter(AiSample.image_hash == image_hash).first()
        is not None
    )


def insert_sample(
    db: Session,
    label_id: int,
    image_path: str,
    embedding: list[float],
    image_hash: str,
    bbox: list[int] | None = None,
    quality_blur: float | None = None,
    quality_brightness: float | None = None,
) -> int:
    sample = AiSample(
        label_id=label_id,
        image_path=image_path,
        embedding_blob=_vec_to_blob(embedding),
        image_hash=image_hash,
        bbox_json=json.dumps([int(v) for v in bbox]) if bbox is not None else None,
        quality_blur=quality_blur,
        quality_brightness=quality_brightness,
    )
    db.add(sample)
    db.commit()
    db.refresh(sample)
    return sample.id


def load_label_embeddings(db: Session, label_id: int) -> list[list[float]]:
    rows = (
        db.query(AiSample.embedding_blob)
        .filter(AiSample.label_id == label_id)
        .order_by(AiSample.id)
        .all()
    )
    return [_blob_to_vec(row.embedding_blob) for row in rows]


def load_all_prototypes(db: Session) -> dict[str, list[float]]:
    rows = (
        db.query(AiLabel.name, AiPrototype.embedding_blob)
        .join(AiPrototype, AiPrototype.label_id == AiLabel.id)
        .order_by(AiLabel.name)
        .all()
    )
    return {row.name: _blob_to_vec(row.embedding_blob) for row in rows}


def upsert_prototype(db: Session, label_id: int, embedding: list[float]) -> None:
    now = datetime.now(timezone.utc)
    blob = _vec_to_blob(embedding)
    stmt = (
        pg_insert(AiPrototype)
        .values(label_id=label_id, embedding_blob=blob, updated_at=now)
        .on_conflict_do_update(
            index_elements=["label_id"],
            set_={"embedding_blob": blob, "updated_at": now},
        )
    )
    db.execute(stmt)
    db.commit()


def get_label_name(db: Session, label_id: int) -> str | None:
    row = db.query(AiLabel.name).filter(AiLabel.id == label_id).first()
    return str(row.name) if row is not None else None


def list_labels(db: Session) -> list[dict[str, Any]]:
    rows = (
        db.query(AiLabel.id, AiLabel.name, AiLabel.created_at)
        .order_by(AiLabel.name)
        .all()
    )
    return [
        {
            "id": row.id,
            "name": row.name,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in rows
    ]
