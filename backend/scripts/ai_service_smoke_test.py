"""Simple smoke test for the AI service endpoints.

This script is intentionally small and readable. It loads the service module
directly, sends one image or one video to the backend detector/enroll flow, and
prints the result in plain text so you can inspect the behavior step by step.

Example usage:

    & ".\\.venv\\Scripts\\python.exe" `
      "backend\\scripts\\ai_service_smoke_test.py" `
      --image-path "path\\to\\sample.jpg" `
      --label "test-label"

    & ".\\.venv\\Scripts\\python.exe" `
      "backend\\scripts\\ai_service_smoke_test.py" `
      --video-path "path\\to\\sample.mp4" `
      --label "test-label"
"""

from __future__ import annotations

import argparse
import importlib.util
import sys
from pathlib import Path
from pprint import pprint

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

SCHEMAS_PATH = BACKEND_DIR / "app" / "schemas" / "ai_pipeline.py"
SCHEMAS_SPEC = importlib.util.spec_from_file_location("ai_pipeline_schemas_smoke", SCHEMAS_PATH)
if SCHEMAS_SPEC is None or SCHEMAS_SPEC.loader is None:
    raise RuntimeError(f"cannot load schema module: {SCHEMAS_PATH}")

SCHEMAS_MODULE = importlib.util.module_from_spec(SCHEMAS_SPEC)
SCHEMAS_SPEC.loader.exec_module(SCHEMAS_MODULE)

EnrollFromImageInput = SCHEMAS_MODULE.EnrollFromImageInput
EnrollFromVideoInput = SCHEMAS_MODULE.EnrollFromVideoInput
RecognizeFromImageInput = SCHEMAS_MODULE.RecognizeFromImageInput


def load_ai_service_module():
    """Load `ai_service.py` from its file path.

    We load it explicitly from the service path to keep this smoke test
    independent from import-path/runtime differences.
    """
    service_path = Path(__file__).resolve().parents[1] / "app" / "services" / "ai_service.py"
    spec = importlib.util.spec_from_file_location("ai_service_smoke_module", service_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load service module: {service_path}")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def read_bytes(path: str | Path) -> bytes:
    """Read a file as bytes."""
    return Path(path).read_bytes()


def run_image_enroll(service, image_path: Path, label: str) -> None:
    """Run the image enroll endpoint and print the output."""
    payload = EnrollFromImageInput(label=label, image_bytes=read_bytes(image_path))
    result = service.enroll_from_image(payload)
    print("[enroll_from_image] result:")
    pprint(result.model_dump())


def run_image_recognize(service, image_path: Path) -> None:
    """Run the image recognize endpoint and print the output."""
    payload = RecognizeFromImageInput(image_bytes=read_bytes(image_path))
    result = service.recognize_from_image(payload)
    print("[recognize_from_image] result:")
    pprint([hit.model_dump() for hit in result])


def run_video_enroll(service, video_path: Path, label: str, sample_interval_sec: float, max_frames: int) -> None:
    """Run the video enroll endpoint and print the output."""
    payload = EnrollFromVideoInput(
        label=label,
        video_bytes=read_bytes(video_path),
        sample_interval_sec=sample_interval_sec,
        max_frames=max_frames,
    )
    result = service.enroll_from_video(payload)
    print("[enroll_from_video] result:")
    pprint(result.model_dump())


def main() -> None:
    """Parse arguments and run one or more smoke tests."""
    parser = argparse.ArgumentParser(description="AI service smoke test")
    parser.add_argument("--image-path", type=Path, help="path to an image file")
    parser.add_argument("--video-path", type=Path, help="path to a video file")
    parser.add_argument("--label", type=str, default="test-label", help="label to use for enroll tests")
    parser.add_argument("--sample-interval-sec", type=float, default=0.3, help="video sampling interval")
    parser.add_argument("--max-frames", type=int, default=0, help="max sampled frames, 0 means unlimited")
    parser.add_argument(
        "--mode",
        choices=["image-enroll", "image-recognize", "video-enroll"],
        default="image-enroll",
        help="which endpoint to run",
    )
    args = parser.parse_args()

    service = load_ai_service_module()

    if args.mode == "image-enroll":
        if args.image_path is None:
            raise SystemExit("--image-path is required for image-enroll")
        run_image_enroll(service, args.image_path, args.label)
        return

    if args.mode == "image-recognize":
        if args.image_path is None:
            raise SystemExit("--image-path is required for image-recognize")
        run_image_recognize(service, args.image_path)
        return

    if args.video_path is None:
        raise SystemExit("--video-path is required for video-enroll")
    run_video_enroll(service, args.video_path, args.label, args.sample_interval_sec, args.max_frames)


if __name__ == "__main__":
    main()