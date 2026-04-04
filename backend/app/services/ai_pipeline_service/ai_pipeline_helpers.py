from __future__ import annotations

import importlib.util
import sys
from functools import lru_cache
from io import BytesIO
from pathlib import Path
import importlib

import numpy as np
import onnxruntime as ort
from PIL import Image


def load_impl_module():
    impl_dir = Path(__file__).resolve().parent
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


def nms_xyxy(detections: list[dict[str, object]], iou_threshold: float = 0.5) -> list[dict[str, object]]:
    ordered = sorted(detections, key=lambda d: float(d.get("confidence", 0.0)), reverse=True)
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
    load_impl_module()
    ai_config = importlib.import_module("ai_config")

    model_file = Path(ai_config.AI_DETECTOR_MODEL_PATH)
    if not model_file.exists():
        raise FileNotFoundError(f"detector model not found: {model_file}")

    session = ort.InferenceSession(str(model_file), providers=["CPUExecutionProvider"])
    input_name = session.get_inputs()[0].name
    output_name = session.get_outputs()[0].name
    conf_threshold = float(ai_config.AI_DETECTOR_CONF_THRESHOLD)
    iou_threshold = float(ai_config.AI_DETECTOR_IOU_THRESHOLD)

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

        return nms_xyxy(candidates, iou_threshold=iou_threshold)

    return detect


def detect_image_bytes(image_bytes: bytes) -> list[dict[str, object]]:
    detector = build_detector()
    return detector(image_bytes)


def ai_db_path() -> str:
    impl = load_impl_module()
    return str(impl.AI_SQLITE_PATH)