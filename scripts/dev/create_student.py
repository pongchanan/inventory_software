import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from passlib.context import CryptContext

# Configuration matches backend/app/auth.py
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / ".env", override=True)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set in environment/.env")

def hash_pw(password):
    return pwd_context.hash(password)

engine = create_engine(DATABASE_URL)

name = "Test Student"
email = "student@test.com"
password = "password123"
uid = "STUDENT_TEST_UID"
role = "user"
authorized = True

with engine.connect() as conn:
    # Check if exists
    res = conn.execute(text("SELECT id FROM users WHERE email = :email"), {"email": email})
    if res.fetchone():
        print(f"User {email} already exists. Updating role to user.")
        conn.execute(text("UPDATE users SET role = 'user', authorized = True WHERE email = :email"), {"email": email})
    else:
        hashed_pwd = hash_pw(password)
        conn.execute(text("""
            INSERT INTO users (uid, name, email, password_hash, role, authorized, created_at, updated_at)
            VALUES (:uid, :name, :email, :password_hash, :role, :authorized, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """), {
            "uid": uid,
            "name": name,
            "email": email,
            "password_hash": hashed_pwd,
            "role": role,
            "authorized": authorized
        })
    conn.commit()
    print(f"Successfully created/updated user: {email} / {password}")
