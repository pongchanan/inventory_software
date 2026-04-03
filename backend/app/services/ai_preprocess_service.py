from __future__ import annotations

from statistics import mean
from io import BytesIO
from pathlib import Path
from typing import Any

from PIL import Image
from PIL import ImageStat


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


def save_crop_file(base_dir: str | Path, label: str, image_bytes: bytes, suffix: str = ".jpg") -> str:
    output_dir = Path(base_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{label}_{image_sha256(image_bytes)[:12]}{suffix}"
    path = output_dir / filename
    path.write_bytes(image_bytes)
    return str(path)

