from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

from app.schemas.ai_pipeline import (
    EnrollFromDetectionsInput,
    EnrollFromVideoInput,
    EnrollResultOutput,
    RecognizeFromDetectionsInput,
    RecognizeHitOutput,
    VideoEnrollOutput,
)


def _load_impl_module():
    base_dir = Path(__file__).resolve().parent
    impl_dir = base_dir / "ai-pipeline-service"
    impl_file = impl_dir / "ai_service_impl.py"

    if not impl_file.exists():
        raise FileNotFoundError(f"AI implementation file not found: {impl_file}")

    if str(impl_dir) not in sys.path:
        sys.path.insert(0, str(impl_dir))

    module_name = "ai_pipeline_service_impl"
    if module_name in sys.modules:
        return sys.modules[module_name]

    spec = importlib.util.spec_from_file_location(module_name, impl_file)
    if spec is None or spec.loader is None:
        raise RuntimeError("Failed to build import spec for ai_service_impl.py")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    sys.modules[module_name] = module
    return module


def enroll_from_detections(payload: EnrollFromDetectionsInput) -> EnrollResultOutput:
    """Enroll object samples from detection boxes in a single image.

    This wrapper forwards the payload to impl.enroll_from_detections after
    converting each detection model to a plain dict. In the impl flow, each
    detection is validated, cropped from the source image, quality-checked,
    deduplicated by image hash, embedded, and stored to the AI SQLite store.
    If at least one sample is accepted, the label prototype is recomputed.
    The returned object includes accepted/rejected counts, saved sample paths,
    rejected reasons, and whether the prototype was updated.
    """
    impl = _load_impl_module()
    result = impl.enroll_from_detections(
        db_path=payload.db_path,
        label=payload.label,
        image_bytes=payload.image_bytes,
        detections=[d.model_dump() for d in payload.detections],
        sample_dir=payload.sample_dir if payload.sample_dir else impl.AI_SAMPLES_DIR,
    )
    return EnrollResultOutput(**result.__dict__)


def recognize_from_detections(payload: RecognizeFromDetectionsInput) -> list[RecognizeHitOutput]:
    """Recognize labels for detection boxes from one image.

    This wrapper converts detections to dicts and calls impl.recognize_from_detections.
    In the impl flow, each detected crop is embedded and compared against all
    stored label prototypes using cosine similarity. The best label is accepted
    only when both similarity threshold and top1-top2 margin pass configured
    limits; otherwise the hit is marked as unknown. The result contains per-box
    label, score, margin, acceptance flag, and detailed score breakdown.
    """
    impl = _load_impl_module()
    hits = impl.recognize_from_detections(
        db_path=payload.db_path,
        image_bytes=payload.image_bytes,
        detections=[d.model_dump() for d in payload.detections],
    )
    return [RecognizeHitOutput(**hit.__dict__) for hit in hits]


def enroll_from_video(payload: EnrollFromVideoInput) -> VideoEnrollOutput:
    """Enroll samples by sampling frames from a video source.

    This wrapper passes path/bytes/options to impl.enroll_from_video. In the
    impl flow, OpenCV opens the video, samples frames by sample_interval_sec,
    runs detector_fn per sampled frame, and skips frames with no detections.
    Frames with detections are sent to enroll_from_detections so the same crop,
    quality, duplicate, embedding, and persistence rules are applied. The output
    aggregates frame-level enrollment stats and saved sample paths across the
    whole video run.
    """
    impl = _load_impl_module()
    result = impl.enroll_from_video(
        db_path=payload.db_path,
        label=payload.label,
        video_path=payload.video_path,
        video_bytes=payload.video_bytes,
        sample_interval_sec=payload.sample_interval_sec,
        max_frames=payload.max_frames,
        sample_dir=payload.sample_dir if payload.sample_dir else impl.AI_SAMPLES_DIR,
        detector_fn=payload.detector_fn,
    )
    return VideoEnrollOutput(**result)
