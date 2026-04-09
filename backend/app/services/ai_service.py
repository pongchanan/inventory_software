from __future__ import annotations

import logging
from dataclasses import asdict, is_dataclass

from sqlalchemy.orm import Session

from app.schemas.ai_pipeline import (
    EnrollFromImageInput,
    EnrollFromVideoInput,
    EnrollResultOutput,
    RecognizeFromImageInput,
    RecognizeHitOutput,
    VideoEnrollOutput,
)
from app.services.ai_pipeline_service.ai_pipeline_helpers import (
    build_detector,
    detect_image_bytes,
)
from app.services.ai_pipeline_service import ai_service_impl as impl

logger = logging.getLogger(__name__)


def _to_mapping(value):
    if is_dataclass(value):
        return asdict(value)
    return value.__dict__


def enroll_from_image(db: Session, payload: EnrollFromImageInput) -> EnrollResultOutput:
    """Enroll samples from a single image.

    The backend runs detection on `payload.image_bytes`, then forwards the
    detected boxes to the implementation layer. Accepted crops are quality-
    checked, deduplicated, embedded, stored, and used to recompute the label
    prototype when at least one sample passes.
    """
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
        db=db,
        label=payload.label,
        image_bytes=payload.image_bytes,
        detections=detections,
        sample_dir=impl.AI_SAMPLES_DIR,
        item_id=payload.item_id,
    )
    return EnrollResultOutput(**_to_mapping(result))


def recognize_from_image(
    db: Session, payload: RecognizeFromImageInput
) -> list[RecognizeHitOutput]:
    """Recognize labels from a single image.

    The backend detects objects on `payload.image_bytes` first, then the
    implementation layer embeds each crop and compares it with stored label
    prototypes. The result is one recognition record per detected box.
    """
    logger.info("[ai_service][recognize] image size=%d bytes", len(payload.image_bytes))
    detections = detect_image_bytes(payload.image_bytes)

    if not detections:
        logger.warning("[ai_service][recognize] no detections — returning empty list")
        return []

    logger.info("[ai_service][recognize] %d detection(s) found, running recognizer...", len(detections))

    hits = impl.recognize_from_detections(
        db=db,
        image_bytes=payload.image_bytes,
        detections=detections,
    )
    outputs = [RecognizeHitOutput(**_to_mapping(hit)) for hit in hits]

    # --- Debug: log recognition results ---
    for i, out in enumerate(outputs):
        status = "✅ ACCEPTED" if out.accepted else "❌ rejected"
        logger.info(
            "[ai_service][recognize]   hit[%d] %s label=%r score=%.3f margin=%.3f bbox=%s",
            i, status, out.label, out.score, out.margin, out.bbox,
        )
    accepted_items = [out.label for out in outputs if out.accepted]
    if accepted_items:
        logger.info("[ai_service][recognize] === Recognized items: %s ===", accepted_items)
    else:
        logger.info("[ai_service][recognize] === No items confidently recognized ===")

    return outputs


def enroll_from_video(db: Session, payload: EnrollFromVideoInput) -> VideoEnrollOutput:
    """Enroll samples from a video source.

    The implementation samples frames from the video, runs the backend detector
    on each sampled frame, and forwards detected crops through the same enroll
    flow used by image enrollment.
    """
    result = impl.enroll_from_video(
        db=db,
        label=payload.label,
        video_path=None,
        video_bytes=payload.video_bytes,
        sample_interval_sec=payload.sample_interval_sec,
        max_frames=payload.max_frames,
        sample_dir=impl.AI_SAMPLES_DIR,
        detector_fn=build_detector(),
        item_id=payload.item_id,
    )
    return VideoEnrollOutput(**result)
