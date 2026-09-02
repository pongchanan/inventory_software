"""Add optional images to existing vote proposals without altering vote records."""

import sys
from pathlib import Path

from sqlalchemy import inspect, text

BACKEND_DIR = Path(__file__).resolve().parents[2]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database import engine


def main() -> None:
    columns = {column["name"] for column in inspect(engine).get_columns("vote_proposals")}
    if "image_path" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE vote_proposals ADD COLUMN image_path VARCHAR(500)"))
    print("Vote proposal image column is ready.")


if __name__ == "__main__":
    main()
