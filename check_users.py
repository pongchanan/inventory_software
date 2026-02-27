import os
import sys
from sqlalchemy import create_engine, text

# Add backend to path to use app modules if needed
sys.path.append(os.path.join(os.getcwd(), 'backend'))

DATABASE_URL = "postgresql://postgres:ThKfWmKKUNcJMeumICeaiPxZISnoOeBX@gondola.proxy.rlwy.net:56989/railway"

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    result = conn.execute(text("SELECT email, role, authorized FROM users;"))
    for row in result:
        print(f"Email: {row[0]}, Role: {row[1]}, Authorized: {row[2]}")
