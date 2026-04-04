from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class Detection:
    bbox: list[int]
    confidence: float = 0.0
    class_name: str | None = None


@dataclass(slots=True)
class QualitySummary:
    brightness: float
    blur_score: float


@dataclass(slots=True)
class EnrollResult:
    ok: bool
    label: str
    accepted_count: int
    rejected_count: int
    saved_samples: list[str] = field(default_factory=list)
    rejected_samples: list[dict[str, Any]] = field(default_factory=list)
    prototype_updated: bool = False


@dataclass(slots=True)
class RecognizeHit:
    bbox: list[int]
    label: str
    score: float
    margin: float
    accepted: bool
    scores: list[dict[str, Any]] = field(default_factory=list)


@dataclass(slots=True)
class SampleRecord:
    sample_id: int
    label_id: int
    label: str
    image_path: str
    image_hash: str
    bbox: list[int] | None
    quality_blur: float | None = None
    quality_brightness: float | None = None
