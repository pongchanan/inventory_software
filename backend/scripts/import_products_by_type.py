"""Import curated product images as completed AI enrollments.

Dry-run is the default. Use ``--apply`` to write to PostgreSQL and S3.

Examples:
    python scripts/import_products_by_type.py
    python scripts/import_products_by_type.py --apply --limit 1
    python scripts/import_products_by_type.py --apply
"""

from __future__ import annotations

import argparse
import hashlib
import os
import re
import sys
import time
import uuid
from dataclasses import dataclass
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = BACKEND_DIR.parents[1]
DEFAULT_SOURCE = PROJECT_DIR / "products-by-type"
sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy.exc import OperationalError

from app.database import SessionLocal, engine
from app.models.ai_label import AiLabel
from app.models.ai_prototype import AiPrototype
from app.models.ai_sample import AiSample
from app.models.item import Item


@dataclass(frozen=True)
class Product:
    name: str
    quantity: int
    images: tuple[Path, ...]


def parse_products(source: Path) -> tuple[list[Product], int]:
    if not source.is_dir():
        raise RuntimeError(f"source directory not found: {source}")

    products: list[Product] = []
    duplicate_files = 0
    seen_hashes: set[str] = set()

    for folder in sorted(path for path in source.iterdir() if path.is_dir()):
        description_path = folder / "description.txt"
        if not description_path.is_file():
            raise RuntimeError(f"missing description.txt: {folder}")

        description = description_path.read_text(encoding="utf-8-sig")
        name_match = re.search(r"^ชื่อประเภท:\s*(.+?)\s*$", description, re.MULTILINE)
        quantity_match = re.search(
            r"^จำนวนสินค้า:\s*(\d+)\s*$", description, re.MULTILINE
        )
        if not name_match or not quantity_match:
            raise RuntimeError(f"invalid metadata: {description_path}")

        images: list[Path] = []
        image_dir = folder / "images"
        for image_path in sorted(image_dir.glob("*")):
            if image_path.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
                continue
            digest = hashlib.sha256(image_path.read_bytes()).hexdigest()
            if digest in seen_hashes:
                duplicate_files += 1
                continue
            seen_hashes.add(digest)
            images.append(image_path)

        if not images:
            raise RuntimeError(f"no unique images: {folder}")

        products.append(
            Product(
                name=name_match.group(1).strip(),
                quantity=int(quantity_match.group(1)),
                images=tuple(images),
            )
        )

    names = [product.name for product in products]
    if len(names) != len(set(names)):
        raise RuntimeError("duplicate product names found in source metadata")
    return products, duplicate_files


def require_environment() -> None:
    required = [
        "DATABASE_URL",
        "AWS_ENDPOINT_URL",
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
        "S3_BUCKET_NAME",
    ]
    missing = [name for name in required if not os.getenv(name)]
    if missing:
        raise RuntimeError(f"missing environment variables: {', '.join(missing)}")


def verify_s3_write_access() -> None:
    from app.services.s3_storage import _get_bucket, _get_client

    client = _get_client()
    bucket = _get_bucket()
    key = f"import-preflight/{uuid.uuid4().hex}.txt"
    client.put_object(Bucket=bucket, Key=key, Body=b"inventory import preflight")
    try:
        client.head_object(Bucket=bucket, Key=key)
    finally:
        client.delete_object(Bucket=bucket, Key=key)


def completed_item_is_valid(db, item: Item) -> bool:
    label = db.query(AiLabel).filter(AiLabel.item_id == item.id).first()
    if label is None:
        return False
    has_sample = db.query(AiSample.id).filter(AiSample.label_id == label.id).first()
    has_prototype = (
        db.query(AiPrototype.label_id)
        .filter(AiPrototype.label_id == label.id)
        .first()
    )
    return bool(has_sample and has_prototype and item.image_path)


def select_product_detection(detections: list[dict[str, object]]) -> list[dict[str, object]]:
    """Keep one object crop per curated product image.

    The detector can return overlapping boxes for component parts. The largest
    box best represents the single product shown in each source image.
    """
    valid = [
        detection
        for detection in detections
        if isinstance(detection.get("bbox"), list)
        and len(detection["bbox"]) == 4
    ]
    if not valid:
        return []

    def area(detection: dict[str, object]) -> int:
        x1, y1, x2, y2 = [int(value) for value in detection["bbox"]]
        return max(0, x2 - x1) * max(0, y2 - y1)

    return [max(valid, key=area)]


def import_product(db, product: Product, detector, enroll_from_detections) -> tuple[str, int, int]:
    from app.services.s3_storage import upload_item_image

    existing = db.query(Item).filter(Item.name == product.name).first()
    resumed = existing is not None
    if existing is not None:
        if existing.enroll_status == "done" and completed_item_is_valid(db, existing):
            sample_count = (
                db.query(AiSample.id)
                .join(AiLabel, AiLabel.id == AiSample.label_id)
                .filter(AiLabel.item_id == existing.id)
                .count()
            )
            return "skipped", sample_count, 0
        if existing.enroll_status not in {"processing", "failed"}:
            raise RuntimeError(
                f"existing item cannot be resumed: {product.name} "
                f"(id={existing.id}, status={existing.enroll_status})"
            )
        item_id = existing.id
        existing.quantity = product.quantity
        existing.enroll_status = "processing"
        db.commit()
    else:
        first_image = product.images[0].read_bytes()
        item = Item(
            name=product.name,
            quantity=product.quantity,
            is_active=True,
            enroll_status="processing",
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        item_id = item.id
        item.image_path = upload_item_image(first_image, item_id, "image/jpeg")
        db.commit()

    accepted = 0
    rejected = 0
    try:
        for image_path in product.images:
            image_bytes = image_path.read_bytes()
            detections = select_product_detection(detector(image_bytes))
            result = enroll_from_detections(
                db=db,
                label=product.name,
                image_bytes=image_bytes,
                detections=detections,
                item_id=item_id,
            )
            accepted += result.accepted_count
            rejected += result.rejected_count

        sample_count = (
            db.query(AiSample.id)
            .join(AiLabel, AiLabel.id == AiSample.label_id)
            .filter(AiLabel.item_id == item_id)
            .count()
        )
        if sample_count == 0:
            raise RuntimeError("enrollment produced no accepted samples")

        item = db.query(Item).filter(Item.id == item_id).one()
        item.enroll_status = "done"
        db.commit()
        return "resumed" if resumed else "imported", sample_count, rejected
    except OperationalError:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        failed_item = db.query(Item).filter(Item.id == item_id).first()
        if failed_item is not None:
            failed_item.enroll_status = "failed"
            db.commit()
        raise


def run_apply(products: list[Product]) -> int:
    from app.services.ai_pipeline_service.ai_pipeline_helpers import build_detector
    from app.services.ai_pipeline_service.ai_service_impl import enroll_from_detections

    require_environment()
    verify_s3_write_access()
    print("S3 write/read/delete preflight: OK", flush=True)

    detector = build_detector()
    print("AI detector preflight: OK", flush=True)

    statuses = {"imported": 0, "resumed": 0, "skipped": 0}
    accepted_total = 0
    rejected_total = 0
    for index, product in enumerate(products, start=1):
        for attempt in range(1, 4):
            db = SessionLocal()
            try:
                status, accepted, rejected = import_product(
                    db, product, detector, enroll_from_detections
                )
                break
            except OperationalError:
                engine.dispose()
                if attempt == 3:
                    raise
                delay = 2**attempt
                print(
                    f"[{index}/{len(products)}] database connection lost; "
                    f"retrying in {delay}s (attempt {attempt + 1}/3)",
                    flush=True,
                )
                time.sleep(delay)
            finally:
                db.close()
        else:
            raise RuntimeError(f"failed to import after retries: {product.name}")

        statuses[status] += 1
        accepted_total += accepted
        rejected_total += rejected
        print(
            f"[{index}/{len(products)}] {status}: {product.name} "
            f"(samples={accepted}, rejected={rejected})",
            flush=True,
        )

    print(
        f"Apply summary: imported={statuses['imported']}, "
        f"resumed={statuses['resumed']}, skipped={statuses['skipped']}, "
        f"accepted_samples={accepted_total}, rejected_detections={rejected_total}",
        flush=True,
    )
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Import products-by-type as completed AI enrollments"
    )
    parser.add_argument("--apply", action="store_true", help="write to DB and S3")
    parser.add_argument("--limit", type=int, help="process only the first N products")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    products, duplicate_files = parse_products(args.source.resolve())
    if args.limit is not None:
        if args.limit < 1:
            raise RuntimeError("--limit must be at least 1")
        products = products[: args.limit]

    print(f"Products: {len(products)}")
    print(f"Total quantity: {sum(product.quantity for product in products)}")
    print(f"Unique source images: {sum(len(product.images) for product in products)}")
    print(f"Duplicate source files skipped: {duplicate_files}")

    if not args.apply:
        print("Dry run only; no DB or S3 writes were made.")
        return 0
    return run_apply(products)


if __name__ == "__main__":
    raise SystemExit(main())
