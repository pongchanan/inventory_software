from __future__ import annotations

from pydantic import BaseModel, Field


class DetectionInput(BaseModel):
    bbox: list[int] = Field(..., min_length=4, max_length=4)
    confidence: float = 0.0
    class_name: str | None = None


class EnrollFromDetectionsInput(BaseModel):
    db_path: str
    label: str
    image_bytes: bytes
    detections: list[DetectionInput]
    sample_dir: str | None = None


class EnrollFromVideoInput(BaseModel):
    db_path: str
    label: str
    video_path: str | None = None
    video_bytes: bytes | None = None
    sample_interval_sec: float = 0.3
    max_frames: int = 0
    sample_dir: str | None = None
    detector_fn: object | None = None


class RecognizeFromDetectionsInput(BaseModel):
    db_path: str
    image_bytes: bytes
    detections: list[DetectionInput]


class EnrollResultOutput(BaseModel):
    ok: bool
    label: str
    accepted_count: int
    rejected_count: int
    saved_samples: list[str]
    rejected_samples: list[dict]
    prototype_updated: bool


class RecognizeHitOutput(BaseModel):
    bbox: list[int]
    label: str
    score: float
    margin: float
    accepted: bool
    scores: list[dict]


class VideoEnrollOutput(BaseModel):
    ok: bool
    label: str
    frames_seen: int
    frames_sampled: int
    sample_interval_sec: float
    frame_step: int
    accepted_count: int
    rejected_count: int
    skipped_no_detections: int
    saved_samples: list[str]
    frame_results: list[dict]
