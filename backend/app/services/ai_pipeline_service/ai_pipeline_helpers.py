from __future__ import annotations

from functools import lru_cache
from io import BytesIO
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image
import logging
from . import ai_config

logger = logging.getLogger(__name__)


def iou_xyxy(a: list[int], b: list[int]) -> float:
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


def nms_xyxy(
    detections: list[dict[str, object]], iou_threshold: float = 0.5
) -> list[dict[str, object]]:
    ordered = sorted(
        detections, key=lambda d: float(d.get("confidence", 0.0)), reverse=True
    )
    kept: list[dict[str, object]] = []
    for det in ordered:
        box = det.get("bbox")
        if not isinstance(box, list) or len(box) != 4:
            continue
        if all(iou_xyxy(box, kept_det["bbox"]) < iou_threshold for kept_det in kept):
            kept.append(det)
    return kept


@lru_cache(maxsize=1)
def build_detector():
    model_file = Path(ai_config.AI_DETECTOR_MODEL_PATH)
    if not model_file.exists():
        raise FileNotFoundError(f"detector model not found: {model_file}")

    logger.info("[detector] Loading model from: %s", model_file)
    session = ort.InferenceSession(str(model_file), providers=["CPUExecutionProvider"])
    
    input_info = session.get_inputs()[0]
    output_info = session.get_outputs()[0]
    input_name = input_info.name
    output_name = output_info.name
    
    logger.info("[detector] Model input: %s, shape: %s", input_name, input_info.shape)
    logger.info("[detector] Model output: %s, shape: %s", output_name, output_info.shape)
    
    conf_threshold = float(ai_config.AI_DETECTOR_CONF_THRESHOLD)
    iou_threshold = float(ai_config.AI_DETECTOR_IOU_THRESHOLD)
    logger.info("[detector] Config: conf_thresh=%.3f, iou_thresh=%.3f", conf_threshold, iou_threshold)

    def detect(frame_bytes: bytes) -> list[dict[str, object]]:
        image = Image.open(BytesIO(frame_bytes)).convert("RGB")
        orig_w, orig_h = image.size
        logger.info("[detector] Inferred image: %dx%d -> 640x640", orig_w, orig_h)
        
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
            logger.warning("[detector] Unexpected output dimension: %d", arr.ndim)
            return []

        logger.debug("[detector] Processed predictions shape: %s", preds.shape)

        if preds.shape[1] < 5:
            logger.warning("[detector] Output row too short: %d", preds.shape[1])
            return []

        candidates: list[dict[str, object]] = []
        sx = orig_w / 640.0
        sy = orig_h / 640.0

        max_conf_found = 0.0
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

            if conf > max_conf_found:
                max_conf_found = conf

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

        logger.info("[detector] Max confidence in frame: %.4f (thresh=%.4f)", max_conf_found, conf_threshold)
        logger.info("[detector] Candidates passing threshold: %d", len(candidates))

        result = nms_xyxy(candidates, iou_threshold=iou_threshold)
        logger.info("[detector] Final detections after NMS: %d", len(result))
        return result

    return detect


def detect_image_bytes(image_bytes: bytes) -> list[dict[str, object]]:
    detector = build_detector()
    return detector(image_bytes)
