"""
Re-embed all AI samples and recompute prototypes.

Use this after changing the recognizer model (e.g. enabling Triplet head)
to update all embeddings to match the new model's output dimensions.

Usage:
    python scripts/re_embed_all.py
"""

import sys
from pathlib import Path

# Add project root to path
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

from array import array
from io import BytesIO

from app.database import SessionLocal
from app.models.ai_sample import AiSample
from app.models.ai_label import AiLabel
from app.services.s3_storage import download_image
from app.services.ai_pipeline_service.ai_embedding_service import (
    embed_image,
    l2_normalize,
    _ensure_model,
)
from app.services.ai_pipeline_service.ai_prototype_service import recompute_label_prototype


def _vec_to_blob(vec: list[float]) -> bytes:
    return array("f", [float(v) for v in vec]).tobytes()


def _blob_to_vec(blob: bytes) -> list[float]:
    values = array("f")
    values.frombytes(blob)
    return [float(v) for v in values]


def main():
    print("=" * 60)
    print("Re-Embed All Samples + Recompute Prototypes")
    print("=" * 60)

    # Force-load the model to confirm Triplet head status
    model, transform, device = _ensure_model()
    
    # Check embedding dimension
    import torch
    with torch.no_grad():
        dummy = torch.zeros(1, 3, 224, 224).to(device)
        out = model(dummy)
        embed_dim = out.shape[1]
    print(f"\n[model] Embedding dimension: {embed_dim}")

    db = SessionLocal()
    try:
        # Get all samples
        samples = db.query(AiSample).order_by(AiSample.id).all()
        print(f"[db] Found {len(samples)} samples to re-embed")

        if not samples:
            print("No samples found. Nothing to do.")
            return

        # Get all labels
        labels = db.query(AiLabel).order_by(AiLabel.id).all()
        print(f"[db] Found {len(labels)} labels")

        # Re-embed each sample
        success = 0
        failed = 0
        for i, sample in enumerate(samples):
            try:
                # Download image from S3
                image_bytes = download_image(sample.image_path)
                if not image_bytes:
                    print(f"  [{i+1}/{len(samples)}] ❌ SKIP sample #{sample.id} - no image data")
                    failed += 1
                    continue

                # Generate new embedding
                new_embedding = embed_image(image_bytes)

                # Update sample
                old_dim = len(_blob_to_vec(sample.embedding_blob))
                sample.embedding_blob = _vec_to_blob(new_embedding)
                
                print(f"  [{i+1}/{len(samples)}] ✅ sample #{sample.id} re-embedded ({old_dim} → {len(new_embedding)} dim)")
                success += 1

            except Exception as exc:
                print(f"  [{i+1}/{len(samples)}] ❌ FAILED sample #{sample.id}: {exc}")
                failed += 1

        # Commit all sample updates
        db.commit()
        print(f"\n[samples] Done: {success} success, {failed} failed")

        # Recompute all prototypes
        print(f"\n--- Recomputing Prototypes ---")
        for label in labels:
            try:
                result = recompute_label_prototype(db, label.id)
                status = "✅" if result.get("ok") else "⚠️"
                print(f"  {status} label '{label.name}' (id={label.id}) → prototype updated")
            except Exception as exc:
                print(f"  ❌ label '{label.name}' (id={label.id}) FAILED: {exc}")

        print(f"\n{'=' * 60}")
        print(f"✅ Re-embedding complete!")
        print(f"   Samples: {success}/{len(samples)}")
        print(f"   Prototypes: {len(labels)} labels recomputed")
        print(f"   Embedding dim: {embed_dim}")
        print(f"{'=' * 60}")

    finally:
        db.close()


if __name__ == "__main__":
    main()
