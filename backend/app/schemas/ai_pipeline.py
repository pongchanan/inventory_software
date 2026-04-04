from __future__ import annotations

from pydantic import BaseModel


class EnrollFromImageInput(BaseModel):
    label: str
    image_bytes: bytes


class EnrollFromVideoInput(BaseModel):
    label: str
    video_bytes: bytes
    sample_interval_sec: float = 0.3
    max_frames: int = 0


class RecognizeFromImageInput(BaseModel):
    image_bytes: bytes


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
