"""
Visualize AI Detection + Recognition on an image.

Usage:
    python scripts/visualize_detections.py <image_path> [--output <output_path>]

Example:
    python scripts/visualize_detections.py test_image.jpg
    python scripts/visualize_detections.py test_image.jpg --output result.jpg
"""

import sys
import os
import argparse
from pathlib import Path
from io import BytesIO

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageDraw, ImageFont

# ── Add project root to path ──
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.services.ai_pipeline_service.ai_config import (
    AI_DETECTOR_MODEL_PATH,
    AI_DETECTOR_CONF_THRESHOLD,
    AI_DETECTOR_IOU_THRESHOLD,
    AI_SIMILARITY_THRESHOLD,
    AI_MIN_MARGIN,
)

# ── Colors for drawing ──
COLOR_ACCEPTED = (0, 200, 0)      # Green
COLOR_REJECTED = (200, 0, 0)      # Red
COLOR_TEXT_BG = (0, 0, 0, 180)    # Black semi-transparent


def load_detector(model_path: str):
    """Load ONNX detector model."""
    session = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
    input_info = session.get_inputs()[0]
    output_info = session.get_outputs()[0]
    print(f"[detector] Model: {Path(model_path).name}")
    print(f"[detector] Input:  {input_info.name} {input_info.shape}")
    print(f"[detector] Output: {output_info.name} {output_info.shape}")
    print(f"[detector] Conf threshold: {AI_DETECTOR_CONF_THRESHOLD}")
    print(f"[detector] IOU threshold:  {AI_DETECTOR_IOU_THRESHOLD}")
    return session


def detect(session: ort.InferenceSession, image: Image.Image) -> list[dict]:
    """Run detection on PIL image. Returns list of {bbox, confidence, class_id}."""
    orig_w, orig_h = image.size
    input_name = session.get_inputs()[0].name
    output_name = session.get_outputs()[0].name

    resized = image.resize((640, 640), Image.Resampling.BILINEAR)
    x = np.asarray(resized, dtype=np.float32) / 255.0
    # ImageNet normalization (matches prototype onnx_detector.py)
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    x = (x - mean) / std
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

    sx = orig_w / 640.0
    sy = orig_h / 640.0
    candidates = []

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

        if conf < AI_DETECTOR_CONF_THRESHOLD:
            continue

        xc, yc, w, h = float(row[0]), float(row[1]), float(row[2]), float(row[3])
        x1 = int(max(0, min(orig_w, (xc - w / 2.0) * sx)))
        y1 = int(max(0, min(orig_h, (yc - h / 2.0) * sy)))
        x2 = int(max(0, min(orig_w, (xc + w / 2.0) * sx)))
        y2 = int(max(0, min(orig_h, (yc + h / 2.0) * sy)))
        if x2 <= x1 or y2 <= y1:
            continue

        candidates.append({"bbox": [x1, y1, x2, y2], "confidence": conf, "class_id": class_id})

    # NMS
    candidates.sort(key=lambda d: d["confidence"], reverse=True)
    kept = []
    for det in candidates:
        box = det["bbox"]
        overlap = False
        for k in kept:
            kb = k["bbox"]
            ix1 = max(box[0], kb[0]); iy1 = max(box[1], kb[1])
            ix2 = min(box[2], kb[2]); iy2 = min(box[3], kb[3])
            iw = max(0, ix2 - ix1); ih = max(0, iy2 - iy1)
            inter = iw * ih
            a1 = (box[2]-box[0]) * (box[3]-box[1])
            a2 = (kb[2]-kb[0]) * (kb[3]-kb[1])
            iou = inter / (a1 + a2 - inter + 1e-6)
            if iou >= AI_DETECTOR_IOU_THRESHOLD:
                overlap = True
                break
        if not overlap:
            kept.append(det)

    print(f"\n[detector] Candidates: {len(candidates)} → After NMS: {len(kept)}")
    return kept


def load_recognizer():
    """Load MobileNet recognizer + prototypes from DB."""
    import torch
    from torchvision import models, transforms

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    backbone = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
    if hasattr(backbone, "classifier"):
        backbone.classifier = torch.nn.Identity()
    backbone.eval()
    backbone.to(device)

    transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    print(f"[recognizer] MobileNetV3-Small loaded on {device}")
    return backbone, transform, device


def embed_crop(model, transform, device, crop: Image.Image) -> list[float]:
    """Generate embedding for a cropped image."""
    import torch

    tensor = transform(crop).unsqueeze(0).to(device)
    with torch.no_grad():
        out = model(tensor)
    return out.squeeze().cpu().tolist()


def cosine_similarity(a, b):
    """Compute cosine similarity between two vectors."""
    if len(a) != len(b):
        limit = min(len(a), len(b))
        a, b = a[:limit], b[:limit]
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(x * x for x in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def load_prototypes_from_db():
    """Load prototype embeddings from database."""
    from app.database import SessionLocal
    from app.services.ai_pipeline_service.ai_db_store import load_all_prototypes

    db = SessionLocal()
    try:
        result = load_all_prototypes(db)
        print(f"[recognizer] Loaded {len(result)} prototypes from DB")
        return result
    finally:
        db.close()


def recognize(model, transform, device, image: Image.Image, detections: list[dict], prototypes: dict) -> list[dict]:
    """Recognize items in detected regions."""
    results = []
    for i, det in enumerate(detections):
        bbox = det["bbox"]
        x1, y1, x2, y2 = bbox

        # Crop
        crop = image.crop((x1, y1, x2, y2))
        if crop.size[0] < 5 or crop.size[1] < 5:
            results.append({**det, "label": "too_small", "score": 0, "margin": 0, "accepted": False, "top3": []})
            continue

        # Embed
        query = embed_crop(model, transform, device, crop)

        # Compare with prototypes
        scores = [(label, cosine_similarity(query, proto)) for label, proto in prototypes.items()]
        scores.sort(key=lambda x: x[1], reverse=True)

        if not scores:
            results.append({**det, "label": "no_protos", "score": 0, "margin": 0, "accepted": False, "top3": []})
            continue

        top1_label, top1_score = scores[0]
        top2_score = scores[1][1] if len(scores) > 1 else 0.0
        margin = float(top1_score - top2_score)
        accepted = top1_score >= AI_SIMILARITY_THRESHOLD and margin >= AI_MIN_MARGIN
        top3 = scores[:3]

        status = "✅" if accepted else "❌"
        top3_str = ", ".join(f"{l}={s:.3f}" for l, s in top3)
        print(f"  det[{i}] {status} top3: [{top3_str}] margin={margin:.3f}")

        results.append({
            **det,
            "label": top1_label if accepted else f"({top1_label}?)",
            "score": float(top1_score),
            "margin": margin,
            "accepted": accepted,
            "top3": top3,
        })

    return results


def draw_results(image: Image.Image, results: list[dict]) -> Image.Image:
    """Draw bboxes and labels on image."""
    img = image.copy()
    draw = ImageDraw.Draw(img)

    # Try to load a font
    try:
        font = ImageFont.truetype("arial.ttf", 14)
        font_small = ImageFont.truetype("arial.ttf", 11)
    except Exception:
        font = ImageFont.load_default()
        font_small = font

    for i, r in enumerate(results):
        bbox = r["bbox"]
        x1, y1, x2, y2 = bbox
        accepted = r.get("accepted", False)
        color = COLOR_ACCEPTED if accepted else COLOR_REJECTED
        width = 3 if accepted else 1

        # Draw bbox
        draw.rectangle([x1, y1, x2, y2], outline=color, width=width)

        # Label text
        label = r.get("label", "?")
        score = r.get("score", 0)
        margin = r.get("margin", 0)
        conf = r.get("confidence", 0)
        text = f"[{i}] {label} s={score:.2f} m={margin:.2f} c={conf:.3f}"

        # Draw label background
        text_bbox = draw.textbbox((x1, y1 - 18), text, font=font)
        draw.rectangle([text_bbox[0]-1, text_bbox[1]-1, text_bbox[2]+1, text_bbox[3]+1], fill=color)
        draw.text((x1, y1 - 18), text, fill=(255, 255, 255), font=font)

        # Draw top-3 candidates
        top3 = r.get("top3", [])
        if top3:
            for j, (lbl, sc) in enumerate(top3[:3]):
                t3_text = f"  {j+1}. {lbl}: {sc:.3f}"
                draw.text((x1 + 2, y2 + 2 + j * 14), t3_text, fill=color, font=font_small)

    return img


def main():
    parser = argparse.ArgumentParser(description="Visualize AI detections on an image")
    parser.add_argument("image", help="Path to input image")
    parser.add_argument("--output", "-o", help="Output image path (default: <input>_detections.jpg)")
    args = parser.parse_args()

    image_path = Path(args.image)
    if not image_path.exists():
        print(f"Error: Image not found: {image_path}")
        sys.exit(1)

    output_path = args.output or str(image_path.stem) + "_detections.jpg"

    print("=" * 60)
    print("AI Detection + Recognition Visualizer")
    print("=" * 60)

    # Load image
    image = Image.open(str(image_path)).convert("RGB")
    print(f"\n[image] {image_path.name}: {image.size[0]}x{image.size[1]}")

    # Load detector
    print(f"\n--- Detector ---")
    session = load_detector(AI_DETECTOR_MODEL_PATH)

    # Detect
    detections = detect(session, image)
    for i, d in enumerate(detections):
        print(f"  det[{i}] bbox={d['bbox']} conf={d['confidence']:.4f}")

    if not detections:
        print("\nNo detections found! Drawing empty image.")
        image.save(output_path)
        print(f"\nSaved: {output_path}")
        return

    # Load recognizer
    print(f"\n--- Recognizer ---")
    model, transform, device = load_recognizer()

    # Load prototypes
    prototypes = load_prototypes_from_db()

    # Recognize
    print(f"\n--- Recognition Results ---")
    results = recognize(model, transform, device, image, detections, prototypes)

    # Summary
    accepted = [r for r in results if r.get("accepted")]
    print(f"\n--- Summary ---")
    print(f"Total detections: {len(results)}")
    print(f"Accepted: {len(accepted)}")
    print(f"Rejected: {len(results) - len(accepted)}")
    if accepted:
        print(f"Recognized: {[r['label'] for r in accepted]}")

    # Draw
    result_image = draw_results(image, results)
    result_image.save(output_path, quality=95)
    print(f"\n✅ Saved visualization: {output_path}")


if __name__ == "__main__":
    main()
