from __future__ import annotations

from array import array
import hashlib
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.services.ai_config import AI_SQLITE_PATH, ensure_ai_runtime_dirs


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _connect(db_path: str | Path = AI_SQLITE_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_ai_store(db_path: str | Path = AI_SQLITE_PATH) -> None:
    ensure_ai_runtime_dirs()
    conn = _connect(db_path)
    cur = conn.cursor()

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS labels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS samples (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            label_id INTEGER NOT NULL,
            image_path TEXT NOT NULL,
            embedding_blob BLOB NOT NULL,
            image_hash TEXT UNIQUE NOT NULL,
            bbox_json TEXT,
            quality_blur REAL,
            quality_brightness REAL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(label_id) REFERENCES labels(id) ON DELETE CASCADE
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS prototypes (
            label_id INTEGER PRIMARY KEY,
            embedding_blob BLOB NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(label_id) REFERENCES labels(id) ON DELETE CASCADE
        )
        """
    )

    cur.execute("CREATE INDEX IF NOT EXISTS idx_samples_label_id ON samples(label_id)")
    conn.commit()
    conn.close()


def _vec_to_blob(vec: list[float]) -> bytes:
    return array("f", [float(value) for value in vec]).tobytes()


def _blob_to_vec(blob: bytes) -> list[float]:
    values = array("f")
    values.frombytes(blob)
    return [float(value) for value in values]


def image_hash_from_bytes(image_bytes: bytes) -> str:
    return hashlib.sha256(image_bytes).hexdigest()


def get_or_create_label_id(db_path: str | Path, label: str) -> int:
    clean_label = label.strip()
    if not clean_label:
        raise ValueError("label cannot be empty")

    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT id FROM labels WHERE name = ?", (clean_label,))
    row = cur.fetchone()
    if row is not None:
        conn.close()
        return int(row["id"])

    cur.execute("INSERT INTO labels(name, created_at) VALUES (?, ?)", (clean_label, _now()))
    label_id = int(cur.lastrowid)
    conn.commit()
    conn.close()
    return label_id


def sample_hash_exists(db_path: str | Path, image_hash: str) -> bool:
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM samples WHERE image_hash = ? LIMIT 1", (image_hash,))
    exists = cur.fetchone() is not None
    conn.close()
    return exists


def insert_sample(
    db_path: str | Path,
    label_id: int,
    image_path: str,
    embedding: list[float],
    image_hash: str,
    bbox: list[int] | None = None,
    quality_blur: float | None = None,
    quality_brightness: float | None = None,
) -> int:
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO samples(
            label_id,
            image_path,
            embedding_blob,
            image_hash,
            bbox_json,
            quality_blur,
            quality_brightness,
            created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            label_id,
            image_path,
            _vec_to_blob(embedding),
            image_hash,
            json.dumps([int(v) for v in bbox]) if bbox is not None else None,
            quality_blur,
            quality_brightness,
            _now(),
        ),
    )
    sample_id = int(cur.lastrowid)
    conn.commit()
    conn.close()
    return sample_id


def load_label_embeddings(db_path: str | Path, label_id: int) -> list[np.ndarray]:
def load_label_embeddings(db_path: str | Path, label_id: int) -> list[list[float]]:
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT embedding_blob FROM samples WHERE label_id = ? ORDER BY id ASC", (label_id,))
    rows = cur.fetchall()
    conn.close()
    return [_blob_to_vec(row["embedding_blob"]) for row in rows]


def load_all_prototypes(db_path: str | Path) -> dict[str, list[float]]:
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute(
        """
        SELECT l.name AS label_name, p.embedding_blob AS embedding_blob
        FROM prototypes p
        JOIN labels l ON l.id = p.label_id
        ORDER BY l.name COLLATE NOCASE ASC
        """
    )
    rows = cur.fetchall()
    conn.close()
    return {str(row["label_name"]): _blob_to_vec(row["embedding_blob"]) for row in rows}


def upsert_prototype(db_path: str | Path, label_id: int, embedding: list[float]) -> None:
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO prototypes(label_id, embedding_blob, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(label_id) DO UPDATE SET
            embedding_blob = excluded.embedding_blob,
            updated_at = excluded.updated_at
        """,
        (label_id, _vec_to_blob(embedding), _now()),
    )
    conn.commit()
    conn.close()


def get_label_name(db_path: str | Path, label_id: int) -> str | None:
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM labels WHERE id = ?", (label_id,))
    row = cur.fetchone()
    conn.close()
    return str(row["name"]) if row is not None else None


def list_labels(db_path: str | Path) -> list[dict[str, Any]]:
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT id, name, created_at FROM labels ORDER BY name COLLATE NOCASE ASC")
    rows = cur.fetchall()
    conn.close()
    return [
        {
            "id": int(row["id"]),
            "name": str(row["name"]),
            "created_at": row["created_at"],
        }
        for row in rows
    ]
