from __future__ import annotations

import os
from pathlib import Path


SERVICES_DIR = Path(__file__).resolve().parent
AI_RUNTIME_DIR = Path(
    os.getenv("AI_RUNTIME_DIR", SERVICES_DIR / ".ai_pipeline_runtime")
)
AI_SAMPLES_DIR = str(
    Path(os.getenv("AI_SAMPLES_DIR", AI_RUNTIME_DIR / "samples")).resolve()
)
AI_MODELS_DIR = str(
    Path(os.getenv("AI_MODELS_DIR", AI_RUNTIME_DIR / "models")).resolve()
)
AI_REPORTS_DIR = str(
    Path(os.getenv("AI_REPORTS_DIR", AI_RUNTIME_DIR / "reports")).resolve()
)

AI_SIMILARITY_THRESHOLD = float(os.getenv("AI_SIMILARITY_THRESHOLD", "0.55"))
AI_MIN_MARGIN = float(os.getenv("AI_MIN_MARGIN", "0.05"))
AI_BLUR_MIN = float(os.getenv("AI_BLUR_MIN", "0.30"))
AI_BRIGHTNESS_MIN = float(os.getenv("AI_BRIGHTNESS_MIN", "20.0"))
AI_BRIGHTNESS_MAX = float(os.getenv("AI_BRIGHTNESS_MAX", "245.0"))
AI_MIN_CROP_AREA_RATIO = float(os.getenv("AI_MIN_CROP_AREA_RATIO", "0.0015"))
AI_MAX_CROP_AREA_RATIO = float(os.getenv("AI_MAX_CROP_AREA_RATIO", "0.98"))

# Latest trained models from prototype
AI_DETECTOR_MODEL_NAME = os.getenv("AI_DETECTOR_MODEL_NAME", "auto_detector_20260404_194242.onnx")
AI_RECOGNIZER_MODEL_NAME = os.getenv("AI_RECOGNIZER_MODEL_NAME", "recognizer_triplet_20260408_122706.pt")
AI_DETECTOR_MODEL_PATH = str(Path(AI_MODELS_DIR, AI_DETECTOR_MODEL_NAME).resolve())
AI_RECOGNIZER_MODEL_PATH = str(Path(AI_MODELS_DIR, AI_RECOGNIZER_MODEL_NAME).resolve())
AI_DETECTOR_CONF_THRESHOLD = float(os.getenv("AI_DETECTOR_CONF_THRESHOLD", "0.25"))
AI_DETECTOR_IOU_THRESHOLD = float(os.getenv("AI_DETECTOR_IOU_THRESHOLD", "0.50"))


def ensure_ai_runtime_dirs() -> dict[str, str]:
    """Create the isolated AI runtime directories used by the temporary pipeline."""
    runtime_dir = Path(AI_RUNTIME_DIR)
    samples_dir = Path(AI_SAMPLES_DIR)
    models_dir = Path(AI_MODELS_DIR)
    reports_dir = Path(AI_REPORTS_DIR)

    runtime_dir.mkdir(parents=True, exist_ok=True)
    samples_dir.mkdir(parents=True, exist_ok=True)
    models_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)

    return {
        "runtime_dir": str(runtime_dir),
        "samples_dir": str(samples_dir),
        "models_dir": str(models_dir),
        "reports_dir": str(reports_dir),
    }
