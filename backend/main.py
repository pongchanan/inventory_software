from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.database import init_db
from app.routes import (
    users_router,
    items_router,
    transactions_router,
    loans_router,
    approvals_router,
    audit_logs_router,
    compartments_router,
    stats_router,
    auth_router,
)
import os


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

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/items", exist_ok=True)

# Mount static files for serving uploaded images
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
app.include_router(transactions_router)
app.include_router(loans_router)
app.include_router(approvals_router)
app.include_router(audit_logs_router)
app.include_router(compartments_router)
app.include_router(stats_router)


@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "message": "Smart Inventory Management API",
        "status": "online",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check for monitoring"""
    return {"status": "healthy"} 


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 3000))
    uvicorn.run(app, host="0.0.0.0", port=port)
