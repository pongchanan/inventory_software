import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text


ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / ".env", override=True)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set in environment/.env")

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    result = conn.execute(text("SELECT email, role, authorized FROM users ORDER BY email;"))
    for row in result:
        print(f"Email: {row[0]}, Role: {row[1]}, Authorized: {row[2]}")
