"""One-time script: drop all existing tables (CASCADE) and recreate from new models."""

from sqlalchemy import inspect, text

from app.database import Base, engine
import app.models  # noqa: F401

# Drop all existing tables
with engine.connect() as conn:
    tables = inspect(engine).get_table_names()
    print("Existing tables:", tables)
    for t in tables:
        conn.execute(text(f'DROP TABLE IF EXISTS "{t}" CASCADE'))
    conn.commit()
    print("All old tables dropped")

# Create new tables
Base.metadata.create_all(bind=engine)
new_tables = inspect(engine).get_table_names()
print("New tables:", new_tables)
