from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routes import (
    users_router,
    items_router,
    transactions_router,
    loans_router,
    approvals_router,
    audit_logs_router,
    compartments_router,
    stats_router
)

# Initialize FastAPI app
app = FastAPI(
    title="Smart Inventory Management API",
    description="Backend API for IoT Inventory System with NFC/RFID tracking",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration - Allow React dashboards to connect
origins = [
    "http://localhost:5173",  # Vite dev server (user dashboard)
    "http://localhost:5174",  # Vite dev server (admin dashboard)
    "http://localhost:3000",  # Alternative port
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "*"  # Allow all origins for demo (remove in production)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users_router)
app.include_router(items_router)
app.include_router(transactions_router)
app.include_router(loans_router)
app.include_router(approvals_router)
app.include_router(audit_logs_router)
app.include_router(compartments_router)
app.include_router(stats_router)


@app.on_event("startup")
def startup_event():
    """Initialize database on startup"""
    print("🚀 Initializing database...")
    init_db()
    print("✅ Database ready!")


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
    uvicorn.run(app, host="0.0.0.0", port=3000)
