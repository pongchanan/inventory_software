import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app import mqtt
from app.database import init_db
from app.routes import (
    access_sessions_router,
    audit_logs_router,
    auth_router,
    inventory_router,
    item_types_router,
    observations_router,
    storage_router,
    users_router,
)
import app.models  # noqa: F401


BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_DIR.parent
UPLOAD_DIR = BACKEND_DIR / "uploads"

# Load .env from the monorepo root.
load_dotenv(REPO_ROOT / ".env", override=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown."""
    print("Initializing database...")
    init_db()
    print("Database ready")
    mqtt.start()
    yield
    mqtt.stop()
    print("Shutting down")


app = FastAPI(
    title="Smart Inventory Management API",
    description="Backend API for IoT Inventory System with NFC/RFID tracking",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    redirect_slashes=False,
)

# Keep serving legacy local uploads when the folder exists.
if UPLOAD_DIR.is_dir():
    app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

origins = [
    "http://localhost:3001",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(item_types_router)
app.include_router(audit_logs_router)
app.include_router(storage_router)
app.include_router(access_sessions_router)
app.include_router(observations_router)
app.include_router(inventory_router)


@app.get("/")
def root():
    """Health check endpoint."""
    return {
        "message": "Smart Inventory Management API",
        "status": "online",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    """Health check for monitoring."""
    return {"status": "healthy"}


def main():
    import uvicorn

    port = int(os.environ.get("PORT", 3000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()