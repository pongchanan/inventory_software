import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401 — register models so create_all sees them
from app.database import init_db
from app.mqtt import start_mqtt, stop_mqtt
from app.routes import auth_router, card_router, users_router

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env", override=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing database...")
    init_db()
    print("Database ready")
    start_mqtt()
    print("MQTT client started")
    yield
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


app.include_router(auth_router)
app.include_router(card_router)
app.include_router(users_router)


@app.get("/")
def root():
    return {
        "message": "Smart Inventory Management API",
        "status": "online",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


def main():
    import uvicorn

    port = int(os.environ.get("PORT", 3000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)


if __name__ == "__main__":
    main()
