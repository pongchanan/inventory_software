from __future__ import annotations

import math
from array import array
from io import BytesIO
from typing import Any
from pathlib import Path

from PIL import Image

from .ai_config import AI_RECOGNIZER_MODEL_PATH

_MODEL = None
_TRANSFORM = None
_DEVICE = None


def _load_torch_model() -> tuple[Any, Any] | None:
    try:
        import torch  # type: ignore
        from torchvision import models, transforms  # type: ignore
    except Exception as exc:
        raise RuntimeError("torch/torchvision is required for MobileNet embedding") from exc

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    
    try:
        backbone = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
    except Exception:
        # Fallback: load without weights for offline environments
        backbone = models.mobilenet_v3_small(weights=None)

    # Remove classification head, keep features only
    if hasattr(backbone, "classifier"):
        backbone.classifier = torch.nn.Identity()
    elif hasattr(backbone, "fc"):
        backbone.fc = torch.nn.Identity()
    
    backbone.eval()
    backbone.to(device)

    # NOTE: Triplet head is DISABLED because existing prototypes in the DB
    # were enrolled using vanilla MobileNet (576-dim embeddings).
    # Loading the Triplet head changes output to 256-dim, causing a dimension
    # mismatch and near-zero cosine similarity scores.
    # To use the Triplet head, ALL prototypes must be re-enrolled first.
    #
    # head_path = Path(AI_RECOGNIZER_MODEL_PATH)
    # if head_path.exists() and head_path.suffix.lower() == ".pt":
    #     checkpoint = torch.load(str(head_path), map_location=device)
    #     ...
    full_model = backbone

    transform = transforms.Compose(
        [
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )

    return full_model, transform, device


def _ensure_model() -> tuple[Any, Any, Any]:
    global _MODEL, _TRANSFORM, _DEVICE

    if _MODEL is not None and _TRANSFORM is not None and _DEVICE is not None:
        return _MODEL, _TRANSFORM, _DEVICE

    loaded = _load_torch_model()
    _MODEL, _TRANSFORM, _DEVICE = loaded
    return _MODEL, _TRANSFORM, _DEVICE


def l2_normalize(vec: list[float]) -> list[float]:
    norm = math.sqrt(sum(value * value for value in vec))
    if norm == 0.0:
        return [float(value) for value in vec]
    return [float(value / norm) for value in vec]


def embed_image(image_bytes: bytes) -> list[float]:
    img = Image.open(BytesIO(image_bytes)).convert("RGB")

    try:
        import torch  # type: ignore
        model, transform, device = _ensure_model()
        x = transform(img).unsqueeze(0).to(device)
        with torch.no_grad():
            vec = model(x).squeeze(0).cpu().tolist()
    except Exception as exc:
        raise RuntimeError(f"failed to generate embedding: {exc}") from exc

    return l2_normalize(vec)


def vector_to_blob(vec: list[float]) -> bytes:
    return array("f", [float(value) for value in vec]).tobytes()


def blob_to_vector(blob: bytes) -> list[float]:
    values = array("f")
    values.frombytes(blob)
    return [float(value) for value in values]


def cosine_similarity(a: list[float], b: list[float]) -> float:
    if len(a) != len(b):
        limit = min(len(a), len(b))
        a = a[:limit]
        b = b[:limit]

    a_norm = math.sqrt(sum(value * value for value in a))
    b_norm = math.sqrt(sum(value * value for value in b))
    if a_norm == 0.0 or b_norm == 0.0:
        return 0.0
    dot = sum(left * right for left, right in zip(a, b))
    return float(dot / (a_norm * b_norm))

