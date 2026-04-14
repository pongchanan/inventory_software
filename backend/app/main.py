import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401 — register models so create_all sees them
from app.database import init_db
from app.mqtt import start_mqtt, stop_mqtt
from app.services.due_date_checker import start_due_date_checker, stop_due_date_checker
from app.routes import (
    activity_log_router,
    auth_router,
    borrowings_router,
    card_router,
    damaged_reports_router,
    dashboard_router,
    items_router,
    sessions_router,
    users_router,
)

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env", override=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing database...")
    init_db()
    print("Database ready")

    # On every startup, any item still marked "processing" was interrupted by a
    # crash or power cut before the ML pipeline finished.  Mark them "failed" so
    # the frontend can surface an error and the admin can re-upload the video.
    from sqlalchemy import update as sa_update
    from app.database import SessionLocal
    from app.models.item import Item as _Item

    _db = SessionLocal()
    try:
        affected = _db.execute(
            sa_update(_Item)
            .where(_Item.enroll_status == "processing")
            .values(enroll_status="failed")
        ).rowcount
        _db.commit()
        if affected:
            print(
                f"[startup] reset {affected} interrupted enrollment job(s) to 'failed'"
            )
    finally:
        _db.close()

    start_mqtt()
    print("MQTT client started")
    start_due_date_checker()
    yield
    stop_due_date_checker()
    stop_mqtt()
    print("Shutting down")


app = FastAPI(
    title="Smart Inventory Management API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    redirect_slashes=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(activity_log_router)
app.include_router(auth_router)
app.include_router(borrowings_router)
app.include_router(card_router)
app.include_router(damaged_reports_router)
app.include_router(dashboard_router)
app.include_router(items_router)
app.include_router(sessions_router)
app.include_router(users_router)


@app.get("/", tags=["General"])
def root():
    return {
        "message": "Smart Inventory Management API",
        "status": "online",
        "docs": "/docs",
    }


@app.get("/health", tags=["General"])
def health_check():
    return {"status": "healthy"}


@app.post("/api/admin/re-embed", tags=["Admin API"])
def admin_re_embed():
    """Re-embed all AI samples with current model and recompute prototypes.
    Run this after changing the recognizer model."""
    import threading
    from array import array as _array
    from io import BytesIO

    from app.database import SessionLocal
    from app.models.ai_sample import AiSample
    from app.models.ai_label import AiLabel
    from app.services.s3_storage import download_image
    from app.services.ai_pipeline_service.ai_embedding_service import embed_image
    from app.services.ai_pipeline_service.ai_prototype_service import recompute_label_prototype

    def _vec_to_blob(vec):
        return _array("f", [float(v) for v in vec]).tobytes()

    def _run():
        db = SessionLocal()
        try:
            samples = db.query(AiSample).order_by(AiSample.id).all()
            labels = db.query(AiLabel).order_by(AiLabel.id).all()
            print(f"[re-embed] Starting: {len(samples)} samples, {len(labels)} labels")

            success, failed = 0, 0
            for i, sample in enumerate(samples):
                try:
                    image_bytes = download_image(sample.image_path)
                    if not image_bytes:
                        failed += 1
                        continue
                    new_emb = embed_image(image_bytes)
                    sample.embedding_blob = _vec_to_blob(new_emb)
                    success += 1
                    if (i + 1) % 50 == 0:
                        print(f"[re-embed] Progress: {i+1}/{len(samples)}")
                except Exception as exc:
                    failed += 1

            db.commit()
            print(f"[re-embed] Samples done: {success} ok, {failed} failed")

            for label in labels:
                try:
                    recompute_label_prototype(db, label.id)
                except Exception:
                    pass

            print(f"[re-embed] ✅ Complete! {success}/{len(samples)} samples, {len(labels)} prototypes")
        finally:
            db.close()

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
    return {"status": "started", "message": "Re-embedding in background"}


def main():
    import uvicorn

    port = int(os.environ.get("PORT", 3000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)


if __name__ == "__main__":
    main()
