from __future__ import annotations

from io import BytesIO
import tempfile
from pathlib import Path
from typing import Any
from PIL import Image

from ai_config import (
    AI_BLUR_MIN,
    AI_BRIGHTNESS_MAX,
    AI_BRIGHTNESS_MIN,
    AI_MAX_CROP_AREA_RATIO,
    AI_MIN_CROP_AREA_RATIO,
    AI_MIN_MARGIN,
    AI_SAMPLES_DIR,
    AI_SIMILARITY_THRESHOLD,
    AI_SQLITE_PATH,
    ensure_ai_runtime_dirs,
)
from ai_embedding_service import cosine_similarity, embed_image
from ai_preprocess_service import crop_by_bbox, image_sha256, is_quality_ok, normalize_bbox, save_crop_file, summarize_quality
from ai_prototype_service import recompute_label_prototype
from ai_sqlite_store import get_or_create_label_id, init_ai_store, insert_sample, load_all_prototypes, sample_hash_exists
from ai_types import Detection, EnrollResult, RecognizeHit


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


def _bbox_area_ratio(bbox: list[int], image_width: int, image_height: int) -> float:
    x1, y1, x2, y2 = [int(v) for v in bbox]
    box_w = max(0, x2 - x1)
    box_h = max(0, y2 - y1)
    image_area = float(max(1, image_width * image_height))
    return float((box_w * box_h) / image_area)


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

    try:
        source_image = Image.open(BytesIO(image_bytes)).convert("RGB")
        source_width, source_height = source_image.size
    except Exception:
        return EnrollResult(ok=False, label=label, accepted_count=0, rejected_count=0, rejected_samples=[{"reason": "decode_failed"}])

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
        area_ratio = _bbox_area_ratio(bbox, source_width, source_height)
        if area_ratio < AI_MIN_CROP_AREA_RATIO or area_ratio > AI_MAX_CROP_AREA_RATIO:
            rejected_count += 1
            rejected_samples.append(
                {
                    "index": index,
                    "bbox": bbox,
                    "reason": "crop_area_out_of_range",
                    "crop_area_ratio": area_ratio,
                    "min_crop_area_ratio": AI_MIN_CROP_AREA_RATIO,
                    "max_crop_area_ratio": AI_MAX_CROP_AREA_RATIO,
                }
            )
            continue

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


def enroll_from_video(
    db_path: str | Path,
    label: str,
    *,
    video_path: str | Path | None = None,
    video_bytes: bytes | None = None,
    sample_interval_sec: float = 0.3,
    max_frames: int = 0,
    sample_dir: str | Path = AI_SAMPLES_DIR,
    detector_fn: Any | None = None,
) -> dict[str, Any]:
    """Extract frames from a video and run each frame through enroll_from_detections.

    `detector_fn` must return a list of detection dictionaries in the same shape used by
    enroll_from_detections. Frames with no detections are skipped.
    """
    try:
        import cv2  # type: ignore
    except Exception as exc:
        raise RuntimeError("opencv-python-headless is required for enroll_from_video") from exc

    _prepare_runtime(db_path)

    if sample_interval_sec <= 0:
        sample_interval_sec = 0.3
    unlimited_frames = max_frames <= 0

    if detector_fn is None:
        raise ValueError("detector_fn is required for enroll_from_video")
    detector = detector_fn

    temp_video_path: Path | None = None
    source_path: Path
    if video_bytes is not None:
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
        try:
            temp_file.write(video_bytes)
        finally:
            temp_file.close()
        temp_video_path = Path(temp_file.name)
        source_path = temp_video_path
    elif video_path is not None:
        source_path = Path(video_path)
    else:
        raise ValueError("either video_path or video_bytes must be provided")

    if not source_path.exists():
        raise ValueError("video source not found")

    capture = cv2.VideoCapture(str(source_path))
    if not capture.isOpened():
        capture.release()
        if temp_video_path is not None:
            temp_video_path.unlink(missing_ok=True)
        raise RuntimeError("failed to open video source")

    fps = float(capture.get(cv2.CAP_PROP_FPS) or 0.0)
    if fps <= 0.0:
        fps = 30.0
    frame_step = max(1, int(round(fps * sample_interval_sec)))

    frames_seen = 0
    frames_sampled = 0
    aggregate_accepted = 0
    aggregate_rejected = 0
    skipped_no_detections = 0
    aggregate_saved: list[str] = []
    aggregate_frame_results: list[dict[str, Any]] = []

    try:
        while True:
            if not unlimited_frames and frames_sampled >= max_frames:
                break
            ok, frame = capture.read()
            if not ok:
                break

            if frames_seen % frame_step != 0:
                frames_seen += 1
                continue

            encoded_ok, encoded = cv2.imencode(".jpg", frame)
            if not encoded_ok:
                aggregate_frame_results.append(
                    {
                        "frame_index": frames_seen,
                        "ok": False,
                        "reason": "encode_failed",
                    }
                )
                frames_seen += 1
                frames_sampled += 1
                continue

            frame_bytes = encoded.tobytes()

            try:
                raw_detections = detector(frame_bytes)
            except Exception:
                raw_detections = []

            if not isinstance(raw_detections, list):
                raw_detections = []

            if not raw_detections:
                skipped_no_detections += 1
                aggregate_frame_results.append(
                    {
                        "frame_index": frames_seen,
                        "detections": 0,
                        "accepted_count": 0,
                        "rejected_count": 0,
                        "prototype_updated": False,
                        "reason": "no_detections",
                    }
                )
                frames_seen += 1
                frames_sampled += 1
                continue

            frame_enroll = enroll_from_detections(
                db_path=db_path,
                label=label,
                image_bytes=frame_bytes,
                detections=raw_detections,
                sample_dir=sample_dir,
            )

            aggregate_accepted += frame_enroll.accepted_count
            aggregate_rejected += frame_enroll.rejected_count
            aggregate_saved.extend(frame_enroll.saved_samples)

            aggregate_frame_results.append(
                {
                    "frame_index": frames_seen,
                    "detections": len(raw_detections),
                    "accepted_count": frame_enroll.accepted_count,
                    "rejected_count": frame_enroll.rejected_count,
                    "prototype_updated": frame_enroll.prototype_updated,
                }
            )

            frames_seen += 1
            frames_sampled += 1
    finally:
        capture.release()
        if temp_video_path is not None:
            temp_video_path.unlink(missing_ok=True)

    return {
        "ok": True,
        "label": label,
        "frames_seen": frames_seen,
        "frames_sampled": frames_sampled,
        "sample_interval_sec": sample_interval_sec,
        "frame_step": frame_step,
        "accepted_count": aggregate_accepted,
        "rejected_count": aggregate_rejected,
        "skipped_no_detections": skipped_no_detections,
        "saved_samples": aggregate_saved,
        "frame_results": aggregate_frame_results,
    }

