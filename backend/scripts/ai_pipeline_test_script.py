from __future__ import annotations

# Phase 4 manual test script for AI pipeline.
#
# Run from workspace root:
#   $env:PYTHONPATH = "inventory_software/backend"
#   & "c:/Users/OPLOR/Documents/University/Software project/inventory_software/.venv/Scripts/python.exe" "inventory_software/backend/scripts/ai_pipeline_test_script.py"
#
# Optional arguments example:
#   $env:PYTHONPATH = "inventory_software/backend"
#   & "c:/Users/OPLOR/Documents/University/Software project/inventory_software/.venv/Scripts/python.exe" "inventory_software/backend/scripts/ai_pipeline_test_script.py" --max-frames 0 --sample-interval-sec 0.3
#
# Default behavior:
# - sample every 0.3 seconds (`--sample-interval-sec 0.3`)
# - no max frame cap (`--max-frames 0`)

import argparse
import json
import shutil
import sys
from datetime import datetime, timezone
from dataclasses import asdict
from io import BytesIO
from pathlib import Path

import numpy as np
from PIL import Image
import onnxruntime as ort

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
AI_SERVICE_DIR = BACKEND_DIR / "app" / "services" / "ai-pipeline-service"

if str(AI_SERVICE_DIR) not in sys.path:
    sys.path.insert(0, str(AI_SERVICE_DIR))

from ai_config import (  # type: ignore
    AI_BLUR_MIN,
    AI_BRIGHTNESS_MAX,
    AI_BRIGHTNESS_MIN,
    AI_DETECTOR_CONF_THRESHOLD,
    AI_DETECTOR_IOU_THRESHOLD,
    AI_DETECTOR_MODEL_PATH,
    AI_MAX_CROP_AREA_RATIO,
    AI_MIN_CROP_AREA_RATIO,
    AI_MIN_MARGIN,
    AI_REPORTS_DIR,
    AI_RUNTIME_DIR,
    AI_SAMPLES_DIR,
    AI_SIMILARITY_THRESHOLD,
)
import ai_service as pipeline  # type: ignore


def _iou_xyxy(a: list[int], b: list[int]) -> float:
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    ix1 = max(ax1, bx1)
    iy1 = max(ay1, by1)
    ix2 = min(ax2, bx2)
    iy2 = min(ay2, by2)
    iw = max(0, ix2 - ix1)
    ih = max(0, iy2 - iy1)
    inter = float(iw * ih)
    if inter <= 0.0:
        return 0.0
    area_a = float(max(0, ax2 - ax1) * max(0, ay2 - ay1))
    area_b = float(max(0, bx2 - bx1) * max(0, by2 - by1))
    union = area_a + area_b - inter
    return inter / union if union > 0.0 else 0.0


def _nms_xyxy(detections: list[dict[str, object]], iou_threshold: float = 0.5) -> list[dict[str, object]]:
    ordered = sorted(detections, key=lambda d: float(d.get("confidence", 0.0)), reverse=True)
    kept: list[dict[str, object]] = []
    for det in ordered:
        box = det.get("bbox")
        if not isinstance(box, list) or len(box) != 4:
            continue
        if all(_iou_xyxy(box, kept_det["bbox"]) < iou_threshold for kept_det in kept):
            kept.append(det)
    return kept


def _build_real_detector(model_path: str | Path, conf_threshold: float = 0.25, iou_threshold: float = 0.5):
    model_file = Path(model_path)
    if not model_file.exists():
        raise FileNotFoundError(f"detector model not found: {model_file}")

    session = ort.InferenceSession(str(model_file), providers=["CPUExecutionProvider"])
    input_name = session.get_inputs()[0].name
    output_name = session.get_outputs()[0].name

    def detect(frame_bytes: bytes) -> list[dict[str, object]]:
        image = Image.open(BytesIO(frame_bytes)).convert("RGB")
        orig_w, orig_h = image.size

        resized = image.resize((640, 640), Image.Resampling.BILINEAR)
        x = np.asarray(resized, dtype=np.float32) / 255.0
        x = np.transpose(x, (2, 0, 1))
        x = np.expand_dims(x, axis=0).astype(np.float32, copy=False)

        output = session.run([output_name], {input_name: x})[0]
        arr = np.asarray(output)
        if arr.ndim == 3:
            preds = arr[0]
            if preds.shape[0] < preds.shape[1]:
                preds = preds.T
        elif arr.ndim == 2:
            preds = arr
        else:
            return []

        if preds.shape[1] < 5:
            return []

        candidates: list[dict[str, object]] = []
        sx = orig_w / 640.0
        sy = orig_h / 640.0

        for row in preds:
            row = np.asarray(row, dtype=np.float32)

            if row.shape[0] > 6:
                class_scores = row[4:]
                class_id = int(np.argmax(class_scores))
                conf = float(class_scores[class_id])
            elif row.shape[0] == 6:
                conf = float(row[4])
                class_id = int(row[5])
            else:
                conf = float(row[4])
                class_id = 0

            if conf < conf_threshold:
                continue

            xc, yc, w, h = float(row[0]), float(row[1]), float(row[2]), float(row[3])
            x1 = int(max(0, min(orig_w, (xc - w / 2.0) * sx)))
            y1 = int(max(0, min(orig_h, (yc - h / 2.0) * sy)))
            x2 = int(max(0, min(orig_w, (xc + w / 2.0) * sx)))
            y2 = int(max(0, min(orig_h, (yc + h / 2.0) * sy)))
            if x2 <= x1 or y2 <= y1:
                continue

            candidates.append(
                {
                    "bbox": [x1, y1, x2, y2],
                    "confidence": conf,
                    "class_id": class_id,
                }
            )

        return _nms_xyxy(candidates, iou_threshold=iou_threshold)

    return detect


def _write_run_report(report_path: Path, payload: dict[str, object]) -> None:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def _extract_first_frame_bytes(video_path: Path) -> bytes:
    try:
        import cv2  # type: ignore
    except Exception as exc:
        raise RuntimeError("opencv-python-headless is required for ai_pipeline_test_script") from exc

    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        capture.release()
        raise RuntimeError(f"cannot open video: {video_path}")

    try:
        ok, frame = capture.read()
        if not ok:
            raise RuntimeError(f"cannot read first frame: {video_path}")
        encoded_ok, encoded = cv2.imencode(".jpg", frame)
        if not encoded_ok:
            raise RuntimeError(f"cannot encode first frame: {video_path}")
        return encoded.tobytes()
    finally:
        capture.release()


def _extract_frame_with_detection(
    video_path: Path,
    detector_fn,
    max_frames_to_scan: int = 180,
    frame_step: int = 3,
) -> tuple[bytes, list[dict[str, object]], int]:
    try:
        import cv2  # type: ignore
    except Exception as exc:
        raise RuntimeError("opencv-python-headless is required for ai_pipeline_test_script") from exc

    if frame_step <= 0:
        frame_step = 1

    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        capture.release()
        raise RuntimeError(f"cannot open video: {video_path}")

    frame_index = 0
    scanned = 0
    try:
        while scanned < max_frames_to_scan:
            ok, frame = capture.read()
            if not ok:
                break

            if frame_index % frame_step != 0:
                frame_index += 1
                continue

            encoded_ok, encoded = cv2.imencode(".jpg", frame)
            if not encoded_ok:
                frame_index += 1
                scanned += 1
                continue

            frame_bytes = encoded.tobytes()
            detections = detector_fn(frame_bytes)
            if detections:
                return frame_bytes, detections, frame_index

            frame_index += 1
            scanned += 1
    finally:
        capture.release()

    raise RuntimeError("no detectable frame found for recognize test")


def _resolve_default_videos() -> tuple[Path, Path]:
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parents[2]

    esp32_candidates = [
        project_root / "prototype" / "poc-espcam-detection" / "data" / "enroll" / "esp32.mp4",
        project_root / "backend" / "app" / "services" / "ai-pipeline-service" / ".ai_pipeline_runtime" / "videos" / "esp32.mp4",
    ]
    capacitor_candidates = [
        project_root / "prototype" / "poc-espcam-detection" / "data" / "enroll" / "capacitor.mp4",
        project_root / "backend" / "app" / "services" / "ai-pipeline-service" / ".ai_pipeline_runtime" / "videos" / "capacitor.mp4",
    ]

    esp32_video = next((p for p in esp32_candidates if p.exists()), None)
    capacitor_video = next((p for p in capacitor_candidates if p.exists()), None)

    if esp32_video is None:
        raise FileNotFoundError("default esp32 video not found")
    if capacitor_video is None:
        raise FileNotFoundError("default capacitor video not found")

    return esp32_video, capacitor_video


def _clean_previous_runtime(db_path: Path, samples_dir: Path) -> None:
    if db_path.exists():
        db_path.unlink()
    if samples_dir.exists():
        shutil.rmtree(samples_dir)
    samples_dir.mkdir(parents=True, exist_ok=True)


def run_phase4_test(
    video_esp32: Path,
    video_capacitor: Path,
    db_path: Path,
    sample_interval_sec: float,
    max_frames: int,
    report_path: Path,
) -> dict[str, object]:
    samples_dir = Path(AI_SAMPLES_DIR)
    _clean_previous_runtime(db_path, samples_dir)
    detector = _build_real_detector(
        AI_DETECTOR_MODEL_PATH,
        conf_threshold=AI_DETECTOR_CONF_THRESHOLD,
        iou_threshold=AI_DETECTOR_IOU_THRESHOLD,
    )

    # 1) Enroll ESP32 from video.
    first_enroll = pipeline.enroll_from_video(
        db_path=db_path,
        label="esp32",
        video_path=video_esp32,
        sample_interval_sec=sample_interval_sec,
        max_frames=max_frames,
        sample_dir=samples_dir,
        detector_fn=detector,
    )

    if int(first_enroll.get("accepted_count", 0)) <= 0:
        raise RuntimeError(
            "first video enroll accepted_count is 0; check torch/torchvision install or quality thresholds"
        )

    # 2) Duplicate test: same video + same label must produce rejects.
    duplicate_enroll = pipeline.enroll_from_video(
        db_path=db_path,
        label="esp32",
        video_path=video_esp32,
        sample_interval_sec=sample_interval_sec,
        max_frames=max_frames,
        sample_dir=samples_dir,
        detector_fn=detector,
    )

    if int(duplicate_enroll.get("rejected_count", 0)) <= 0:
        raise AssertionError("duplicate test failed: expected rejected_count > 0 on second enroll")

    # 3) Enroll second label from capacitor video.
    second_label_enroll = pipeline.enroll_from_video(
        db_path=db_path,
        label="capacitor",
        video_path=video_capacitor,
        sample_interval_sec=sample_interval_sec,
        max_frames=max_frames,
        sample_dir=samples_dir,
        detector_fn=detector,
    )

    # 4) Recognize from the first frame that real detector can detect.
    first_frame, image_detection, detected_frame_index = _extract_frame_with_detection(
        video_path=video_esp32,
        detector_fn=detector,
    )

    default_hits = pipeline.recognize_from_detections(
        db_path=db_path,
        image_bytes=first_frame,
        detections=image_detection,
    )

    if not default_hits:
        raise AssertionError("recognize test failed: no results returned")

    # 5) Force threshold failure.
    original_threshold = pipeline.AI_SIMILARITY_THRESHOLD
    original_margin = pipeline.AI_MIN_MARGIN

    try:
        pipeline.AI_SIMILARITY_THRESHOLD = 1.1
        threshold_hits = pipeline.recognize_from_detections(
            db_path=db_path,
            image_bytes=first_frame,
            detections=image_detection,
        )

        if any(hit.accepted for hit in threshold_hits):
            raise AssertionError("threshold test failed: expected all hits to be rejected")

        # 6) Force margin failure.
        pipeline.AI_SIMILARITY_THRESHOLD = 0.0
        pipeline.AI_MIN_MARGIN = 10.0
        margin_hits = pipeline.recognize_from_detections(
            db_path=db_path,
            image_bytes=first_frame,
            detections=image_detection,
        )

        if any(hit.accepted for hit in margin_hits):
            raise AssertionError("margin test failed: expected all hits to be rejected")
    finally:
        pipeline.AI_SIMILARITY_THRESHOLD = original_threshold
        pipeline.AI_MIN_MARGIN = original_margin

    result = {
        "ok": True,
        "run_at": datetime.now(timezone.utc).isoformat(),
        "db_path": str(db_path),
        "report_path": str(report_path),
        "video_esp32": str(video_esp32),
        "video_capacitor": str(video_capacitor),
        "tuning": {
            "similarity_threshold": AI_SIMILARITY_THRESHOLD,
            "min_margin": AI_MIN_MARGIN,
            "blur_min": AI_BLUR_MIN,
            "brightness_min": AI_BRIGHTNESS_MIN,
            "brightness_max": AI_BRIGHTNESS_MAX,
            "min_crop_area_ratio": AI_MIN_CROP_AREA_RATIO,
            "max_crop_area_ratio": AI_MAX_CROP_AREA_RATIO,
            "detector_conf_threshold": AI_DETECTOR_CONF_THRESHOLD,
            "detector_iou_threshold": AI_DETECTOR_IOU_THRESHOLD,
            "sample_interval_sec": sample_interval_sec,
            "max_frames": max_frames,
        },
        "recognize_frame_index": detected_frame_index,
        "first_enroll": first_enroll,
        "duplicate_enroll": duplicate_enroll,
        "second_label_enroll": second_label_enroll,
        "default_recognize": [asdict(hit) for hit in default_hits],
        "threshold_forced_unknown": [asdict(hit) for hit in threshold_hits],
        "margin_forced_unknown": [asdict(hit) for hit in margin_hits],
    }
    _write_run_report(report_path, result)
    return result


def main() -> None:
    try:
        default_video_esp32, default_video_capacitor = _resolve_default_videos()
        default_video_esp32_str = str(default_video_esp32)
        default_video_capacitor_str = str(default_video_capacitor)
    except FileNotFoundError:
        default_video_esp32_str = ""
        default_video_capacitor_str = ""

    parser = argparse.ArgumentParser(description="Phase 4 pipeline test script")
    parser.add_argument(
        "--video-esp32",
        type=str,
        default=default_video_esp32_str,
        help="path to esp32 enroll video",
    )
    parser.add_argument(
        "--video-capacitor",
        type=str,
        default=default_video_capacitor_str,
        help="path to capacitor enroll video",
    )
    parser.add_argument(
        "--db-path",
        type=str,
        default=str(Path(AI_RUNTIME_DIR) / "ai_pipeline_phase4_test.sqlite3"),
        help="sqlite path for test run",
    )
    parser.add_argument(
        "--report-path",
        type=str,
        default=str(Path(AI_REPORTS_DIR) / "ai_pipeline_phase5_last_run.json"),
        help="path to JSON report for this run",
    )
    parser.add_argument("--sample-interval-sec", type=float, default=0.3, help="sample one frame every N seconds (default 0.3)")
    parser.add_argument("--max-frames", type=int, default=0, help="max sampled frames per video (default 0 = no limit)")
    args = parser.parse_args()

    if not args.video_esp32:
        raise FileNotFoundError("video-esp32 is required; provide --video-esp32 with a valid path")
    if not args.video_capacitor:
        raise FileNotFoundError("video-capacitor is required; provide --video-capacitor with a valid path")

    result = run_phase4_test(
        video_esp32=Path(args.video_esp32),
        video_capacitor=Path(args.video_capacitor),
        db_path=Path(args.db_path),
        sample_interval_sec=args.sample_interval_sec,
        max_frames=args.max_frames,
        report_path=Path(args.report_path),
    )

    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
