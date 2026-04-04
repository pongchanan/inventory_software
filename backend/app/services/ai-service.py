from __future__ import annotations

from dataclasses import asdict, is_dataclass
import importlib.util
from pathlib import Path

_SCHEMAS_PATH = Path(__file__).resolve().parent.parent / "schemas" / "ai_pipeline.py"
_SCHEMAS_SPEC = importlib.util.spec_from_file_location("ai_pipeline_schemas", _SCHEMAS_PATH)
if _SCHEMAS_SPEC is None or _SCHEMAS_SPEC.loader is None:
    raise RuntimeError(f"Failed to load AI schema module from: {_SCHEMAS_PATH}")

_SCHEMAS_MODULE = importlib.util.module_from_spec(_SCHEMAS_SPEC)
_SCHEMAS_SPEC.loader.exec_module(_SCHEMAS_MODULE)

EnrollFromImageInput = _SCHEMAS_MODULE.EnrollFromImageInput
EnrollFromVideoInput = _SCHEMAS_MODULE.EnrollFromVideoInput
EnrollResultOutput = _SCHEMAS_MODULE.EnrollResultOutput
RecognizeFromImageInput = _SCHEMAS_MODULE.RecognizeFromImageInput
RecognizeHitOutput = _SCHEMAS_MODULE.RecognizeHitOutput
VideoEnrollOutput = _SCHEMAS_MODULE.VideoEnrollOutput

_HELPERS_PATH = Path(__file__).resolve().parent / "ai-pipeline-service" / "ai_pipeline_helpers.py"
_HELPERS_SPEC = importlib.util.spec_from_file_location("ai_pipeline_helpers", _HELPERS_PATH)
if _HELPERS_SPEC is None or _HELPERS_SPEC.loader is None:
    raise RuntimeError(f"Failed to load AI helpers module from: {_HELPERS_PATH}")

_HELPERS_MODULE = importlib.util.module_from_spec(_HELPERS_SPEC)
_HELPERS_SPEC.loader.exec_module(_HELPERS_MODULE)

ai_db_path = _HELPERS_MODULE.ai_db_path
detect_image_bytes = _HELPERS_MODULE.detect_image_bytes
load_impl_module = _HELPERS_MODULE.load_impl_module
build_detector = _HELPERS_MODULE.build_detector


def _to_mapping(value):
    if is_dataclass(value):
        return asdict(value)
    return value.__dict__


def enroll_from_image(payload: EnrollFromImageInput) -> EnrollResultOutput:
    """Enroll samples from a single image.

    The backend runs detection on `payload.image_bytes`, then forwards the
    detected boxes to the implementation layer. Accepted crops are quality-
    checked, deduplicated, embedded, stored, and used to recompute the label
    prototype when at least one sample passes.
    """
    impl = load_impl_module()
    detections = detect_image_bytes(payload.image_bytes)
    if not detections:
        return EnrollResultOutput(
            ok=False,
            label=payload.label,
            accepted_count=0,
            rejected_count=0,
            saved_samples=[],
            rejected_samples=[{"reason": "no_detections"}],
            prototype_updated=False,
        )

    result = impl.enroll_from_detections(
        db_path=ai_db_path(),
        label=payload.label,
        image_bytes=payload.image_bytes,
        detections=detections,
        sample_dir=impl.AI_SAMPLES_DIR,
    )
    return EnrollResultOutput(**_to_mapping(result))


def recognize_from_image(payload: RecognizeFromImageInput) -> list[RecognizeHitOutput]:
    """Recognize labels from a single image.

    The backend detects objects on `payload.image_bytes` first, then the
    implementation layer embeds each crop and compares it with stored label
    prototypes. The result is one recognition record per detected box.
    """
    impl = load_impl_module()
    detections = detect_image_bytes(payload.image_bytes)
    if not detections:
        return []

    hits = impl.recognize_from_detections(
        db_path=ai_db_path(),
        image_bytes=payload.image_bytes,
        detections=detections,
    )
    return [RecognizeHitOutput(**_to_mapping(hit)) for hit in hits]


def enroll_from_video(payload: EnrollFromVideoInput) -> VideoEnrollOutput:
    """Enroll samples from a video source.

    The implementation samples frames from the video, runs the backend detector
    on each sampled frame, and forwards detected crops through the same enroll
    flow used by image enrollment.
    """
    impl = load_impl_module()
    result = impl.enroll_from_video(
        db_path=ai_db_path(),
        label=payload.label,
        video_path=None,
        video_bytes=payload.video_bytes,
        sample_interval_sec=payload.sample_interval_sec,
        max_frames=payload.max_frames,
        sample_dir=impl.AI_SAMPLES_DIR,
        detector_fn=build_detector(),
    )
    return VideoEnrollOutput(**result)
