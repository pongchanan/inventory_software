from __future__ import annotations

import os
from statistics import mean
from io import BytesIO
from functools import lru_cache
from pathlib import Path
from typing import Any
from datetime import datetime, timezone

from PIL import Image
from PIL import ImageStat
from dotenv import load_dotenv


def decode_rgb(image_bytes: bytes) -> Image.Image:
    return Image.open(BytesIO(image_bytes)).convert("RGB")


def crop_by_bbox(image_bytes: bytes, bbox: list[int]) -> bytes:
    img = decode_rgb(image_bytes)
    width, height = img.size

    x1, y1, x2, y2 = [int(v) for v in bbox]
    x1 = max(0, min(x1, width - 1))
    y1 = max(0, min(y1, height - 1))
    x2 = max(1, min(x2, width))
    y2 = max(1, min(y2, height))

    if x2 <= x1 or y2 <= y1:
        raise ValueError("invalid_bbox")

    crop = img.crop((x1, y1, x2, y2))
    out = BytesIO()
    crop.save(out, format="JPEG", quality=95)
    return out.getvalue()


def normalize_bbox(raw_bbox: Any, image_size: tuple[int, int]) -> list[int] | None:
    if not isinstance(raw_bbox, dict):
        return None

    try:
        x1 = int(round(float(raw_bbox["x1"])))
        y1 = int(round(float(raw_bbox["y1"])))
        x2 = int(round(float(raw_bbox["x2"])))
        y2 = int(round(float(raw_bbox["y2"])))
    except Exception:
        return None

    if x2 < x1:
        x1, x2 = x2, x1
    if y2 < y1:
        y1, y2 = y2, y1

    width, height = image_size
    x1 = max(0, min(width, x1))
    y1 = max(0, min(height, y1))
    x2 = max(0, min(width, x2))
    y2 = max(0, min(height, y2))

    if x2 <= x1 or y2 <= y1:
        return None
    return [x1, y1, x2, y2]


def summarize_quality(image_bytes: bytes) -> dict[str, float]:
    img = decode_rgb(image_bytes)
    stat = ImageStat.Stat(img)
    brightness = float(mean(stat.mean))
    gray = img.convert("L")
    gray_stat = ImageStat.Stat(gray)
    blur_score = float(min(1.0, gray_stat.stddev[0] / 64.0))
    return {"brightness": brightness, "blur_score": blur_score}


def is_quality_ok(quality: dict[str, float], blur_min: float, brightness_min: float, brightness_max: float) -> bool:
    return (
        quality["blur_score"] >= blur_min
        and brightness_min <= quality["brightness"] <= brightness_max
    )


def image_sha256(image_bytes: bytes) -> str:
    import hashlib

    return hashlib.sha256(image_bytes).hexdigest()


@lru_cache(maxsize=1)
def _load_env_files() -> None:
    service_file = Path(__file__).resolve()
    backend_env = service_file.parents[3] / ".env"
    root_env = service_file.parents[4] / ".env"

    if backend_env.exists():
        load_dotenv(backend_env, override=False)
    if root_env.exists():
        load_dotenv(root_env, override=False)


@lru_cache(maxsize=1)
def _build_s3_client():
    _load_env_files()

    bucket = os.getenv("S3_BUCKET_NAME", "").strip()
    if not bucket:
        return None, None

    try:
        import boto3  # type: ignore
        from botocore.config import Config  # type: ignore
    except Exception as exc:
        raise RuntimeError("S3 storage is configured but boto3 is not installed") from exc

    client = boto3.client(
        "s3",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=os.getenv("AWS_DEFAULT_REGION"),
        endpoint_url=os.getenv("AWS_ENDPOINT_URL"),
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    )
    return client, bucket


def _safe_label(label: str) -> str:
    cleaned = "".join(ch.lower() if ch.isalnum() else "-" for ch in label.strip())
    while "--" in cleaned:
        cleaned = cleaned.replace("--", "-")
    return cleaned.strip("-") or "unknown"


def _save_crop_to_s3(label: str, image_bytes: bytes, suffix: str = ".jpg") -> str | None:
    client, bucket = _build_s3_client()
    if client is None or bucket is None:
        return None

    digest = image_sha256(image_bytes)
    stamp = datetime.now(timezone.utc)
    key = f"ai-samples/{_safe_label(label)}/{stamp:%Y/%m}/{_safe_label(label)}_{digest[:12]}{suffix}"
    content_type = "image/jpeg" if suffix.lower() in {".jpg", ".jpeg"} else "application/octet-stream"

    client.put_object(
        Bucket=bucket,
        Key=key,
        Body=image_bytes,
        ContentType=content_type,
    )
    return f"s3://{bucket}/{key}"


def save_crop_file(base_dir: str | Path, label: str, image_bytes: bytes, suffix: str = ".jpg") -> str:
    s3_path = _save_crop_to_s3(label=label, image_bytes=image_bytes, suffix=suffix)
    if s3_path is not None:
        return s3_path

    output_dir = Path(base_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{label}_{image_sha256(image_bytes)[:12]}{suffix}"
    path = output_dir / filename
    path.write_bytes(image_bytes)
    return str(path)

