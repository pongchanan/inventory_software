from __future__ import annotations

from pathlib import Path
from typing import Any

from app.services.ai_config import (
    AI_BLUR_MIN,
    AI_BRIGHTNESS_MAX,
    AI_BRIGHTNESS_MIN,
    AI_MIN_MARGIN,
    AI_SAMPLES_DIR,
    AI_SIMILARITY_THRESHOLD,
    AI_SQLITE_PATH,
    ensure_ai_runtime_dirs,
)
from app.services.ai_embedding_service import cosine_similarity, embed_image
from app.services.ai_preprocess_service import crop_by_bbox, image_sha256, is_quality_ok, normalize_bbox, save_crop_file, summarize_quality
from app.services.ai_prototype_service import recompute_label_prototype
from app.services.ai_sqlite_store import get_or_create_label_id, init_ai_store, insert_sample, load_all_prototypes, sample_hash_exists
from app.services.ai_types import Detection, EnrollResult, RecognizeHit


def _prepare_runtime(db_path: str | Path = AI_SQLITE_PATH) -> None:
    ensure_ai_runtime_dirs()
    init_ai_store(db_path)


def _coerce_detection(raw_detection: Detection | dict[str, Any]) -> Detection:
    if isinstance(raw_detection, Detection):
        return raw_detection

    bbox = raw_detection.get("bbox") if isinstance(raw_detection, dict) else None
    if not isinstance(bbox, list):
        raise ValueError("invalid_detection_bbox")

    confidence = float(raw_detection.get("confidence", 0.0)) if isinstance(raw_detection, dict) else 0.0
    class_name = raw_detection.get("class_name") if isinstance(raw_detection, dict) else None
    return Detection(bbox=[int(v) for v in bbox], confidence=confidence, class_name=class_name)


def enroll_from_detections(
    db_path: str | Path,
    label: str,
    image_bytes: bytes,
    detections: list[Detection | dict[str, Any]],
    sample_dir: str | Path = AI_SAMPLES_DIR,
) -> EnrollResult:
    _prepare_runtime(db_path)

    if not image_bytes:
        return EnrollResult(ok=False, label=label, accepted_count=0, rejected_count=0, rejected_samples=[{"reason": "empty_image"}])

    label_id = get_or_create_label_id(db_path, label)
    accepted_count = 0
    rejected_count = 0
    saved_samples: list[str] = []
    rejected_samples: list[dict[str, Any]] = []

    for index, raw_detection in enumerate(detections):
        try:
            detection = _coerce_detection(raw_detection)
        except Exception:
            rejected_count += 1
            rejected_samples.append({"index": index, "reason": "invalid_detection"})
            continue

        bbox = detection.bbox
        try:
            cropped_bytes = crop_by_bbox(image_bytes, bbox)
        except Exception:
            rejected_count += 1
            rejected_samples.append({"index": index, "bbox": bbox, "reason": "crop_failed"})
            continue

        try:
            quality = summarize_quality(cropped_bytes)
        except Exception:
            rejected_count += 1
            rejected_samples.append({"index": index, "bbox": bbox, "reason": "quality_failed"})
            continue

        if not is_quality_ok(quality, AI_BLUR_MIN, AI_BRIGHTNESS_MIN, AI_BRIGHTNESS_MAX):
            rejected_count += 1
            rejected_samples.append({"index": index, "bbox": bbox, "reason": "quality_rejected", **quality})
            continue

        crop_hash = image_sha256(cropped_bytes)
        if sample_hash_exists(db_path, crop_hash):
            rejected_count += 1
            rejected_samples.append({"index": index, "bbox": bbox, "reason": "duplicate"})
            continue

        try:
            embedding = embed_image(cropped_bytes)
        except Exception:
            rejected_count += 1
            rejected_samples.append({"index": index, "bbox": bbox, "reason": "embedding_failed"})
            continue

        file_path = save_crop_file(sample_dir, label, cropped_bytes)
        insert_sample(
            db_path=db_path,
            label_id=label_id,
            image_path=file_path,
            embedding=embedding,
            image_hash=crop_hash,
            bbox=bbox,
            quality_blur=quality["blur_score"],
            quality_brightness=quality["brightness"],
        )
        saved_samples.append(file_path)
        accepted_count += 1

    prototype_updated = False
    if accepted_count > 0:
        proto_result = recompute_label_prototype(db_path, label_id)
        prototype_updated = bool(proto_result.get("ok"))

    return EnrollResult(
        ok=True,
        label=label,
        accepted_count=accepted_count,
        rejected_count=rejected_count,
        saved_samples=saved_samples,
        rejected_samples=rejected_samples,
        prototype_updated=prototype_updated,
    )


def recognize_from_detections(
    db_path: str | Path,
    image_bytes: bytes,
    detections: list[Detection | dict[str, Any]],
) -> list[RecognizeHit]:
    _prepare_runtime(db_path)

    if not image_bytes:
        return []

    prototypes = load_all_prototypes(db_path)
    if not prototypes:
        return []

    results: list[RecognizeHit] = []
    for raw_detection in detections:
        detection = _coerce_detection(raw_detection)
        bbox = detection.bbox

        try:
            cropped_bytes = crop_by_bbox(image_bytes, bbox)
            query = embed_image(cropped_bytes)
        except Exception:
            results.append(
                RecognizeHit(
                    bbox=bbox,
                    label="unknown",
                    score=0.0,
                    margin=0.0,
                    accepted=False,
                    scores=[],
                )
            )
            continue

        scores: list[tuple[str, float]] = []
        for label_name, prototype in prototypes.items():
            scores.append((label_name, cosine_similarity(query, prototype)))

        scores.sort(key=lambda item: item[1], reverse=True)
        if not scores:
            results.append(
                RecognizeHit(
                    bbox=bbox,
                    label="unknown",
                    score=0.0,
                    margin=0.0,
                    accepted=False,
                    scores=[],
                )
            )
            continue

        top1_label, top1_score = scores[0]
        top2_score = scores[1][1] if len(scores) > 1 else 0.0
        margin = float(top1_score - top2_score)
        accepted = top1_score >= AI_SIMILARITY_THRESHOLD and margin >= AI_MIN_MARGIN

        results.append(
            RecognizeHit(
                bbox=bbox,
                label=top1_label if accepted else "unknown",
                score=float(top1_score),
                margin=margin,
                accepted=accepted,
                scores=[{"label": label_name, "score": float(score)} for label_name, score in scores],
            )
        )

    return results

