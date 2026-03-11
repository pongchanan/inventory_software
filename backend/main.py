import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the same directory as main.py
load_dotenv(Path(__file__).resolve().parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.database import init_db
import app.models  # noqa: F401 — ensures ALL models (old + new) are registered with
                   # SQLAlchemy metadata before init_db() calls create_all()
from app.routes import (
    users_router,
    items_router,
    item_types_router,
    transactions_router,
    loans_router,
    approvals_router,
    audit_logs_router,
    compartments_router,
    drawers_router,
    stats_router,
    auth_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    # Startup
    print("🚀 Initializing database...")
    init_db()
    print("✅ Database ready!")
    yield
    # Shutdown (if needed)
    print("👋 Shutting down...")


# Initialize FastAPI app
app = FastAPI(
    title="Smart Inventory Management API",
    description="Backend API for IoT Inventory System with NFC/RFID tracking",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Legacy: serve old uploaded images that still live on local disk.
# New uploads go to S3, but images uploaded before the migration are still in
# the local uploads/ folder.  This mount lets them keep working.
UPLOAD_DIR = "uploads"
if os.path.isdir(UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# CORS Configuration - Allow React dashboards to connect
origins = [
    "http://localhost:3001",  # Next.js frontend
    "http://localhost:5173",  # Vite dev server (user dashboard)
    "http://localhost:5174",  # Vite dev server (admin dashboard)
    "http://localhost:3000",  # Alternative port
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

# Include routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(items_router)
app.include_router(item_types_router)
app.include_router(transactions_router)
app.include_router(loans_router)
app.include_router(approvals_router)
app.include_router(audit_logs_router)
app.include_router(compartments_router)
app.include_router(drawers_router)
app.include_router(stats_router)


@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "message": "Smart Inventory Management API",
        "status": "online",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    """Health check for monitoring"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 3000))
    uvicorn.run(app, host="0.0.0.0", port=port)
