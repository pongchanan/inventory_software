from __future__ import annotations

from pathlib import Path

from ai_embedding_service import l2_normalize
from ai_sqlite_store import get_label_name, load_label_embeddings, upsert_prototype


def recompute_label_prototype(db_path: str | Path, label_id: int) -> dict[str, object]:
    embeddings = load_label_embeddings(db_path, label_id)
    if not embeddings:
        return {"ok": False, "reason": "no_samples"}

    length = min(len(vector) for vector in embeddings)
    trimmed = [vector[:length] for vector in embeddings]
    prototype = [sum(values) / float(len(trimmed)) for values in zip(*trimmed)]
    prototype = l2_normalize(prototype)
    upsert_prototype(db_path, label_id, prototype)

    return {
        "ok": True,
        "label_id": label_id,
        "label": get_label_name(db_path, label_id),
        "samples": int(len(embeddings)),
    }


def recompute_label_prototype_by_name(db_path: str | Path, label: str) -> dict[str, object]:
    from ai_sqlite_store import get_or_create_label_id

    label_id = get_or_create_label_id(db_path, label)
    return recompute_label_prototype(db_path, label_id)

