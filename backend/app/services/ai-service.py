from __future__ import annotations

from dataclasses import asdict, is_dataclass

from app.schemas.ai_pipeline import (
    EnrollFromImageInput,
    EnrollFromVideoInput,
    EnrollResultOutput,
    RecognizeFromImageInput,
    RecognizeHitOutput,
    VideoEnrollOutput,
)
from app.services.ai_pipeline_service.ai_pipeline_helpers import (
    ai_db_path,
    build_detector,
    detect_image_bytes,
    load_impl_module,
)


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
