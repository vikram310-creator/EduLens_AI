import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.models import Base

# FIX: Use an absolute path so SQLite always resolves to the same file
# regardless of working directory, and survives Render restarts within a deploy.
_DB_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = f"sqlite:///{os.path.join(_DB_DIR, 'groqchat.db')}"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
    # ── Safe migration: add images_json column if it doesn't exist yet ──────────
    # This handles existing databases that were created before this column was added.
    try:
        with engine.connect() as conn:
            conn.execute(__import__("sqlalchemy").text(
                "ALTER TABLE messages ADD COLUMN images_json TEXT"
            ))
            conn.commit()
    except Exception:
        pass  # Column already exists — safe to ignore

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
