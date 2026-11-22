import logging
import time
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.db.session import engine

# логгер uvicorn уже настроен на INFO, поэтому наши сообщения будут видны
logger = logging.getLogger("uvicorn.error")

API_ROOT = Path(__file__).resolve().parents[2]  # корень apps/api (в контейнере /app)


def wait_for_db(retries: int = 30, delay: float = 1.0) -> None:
    for attempt in range(1, retries + 1):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return
        except OperationalError:
            logger.warning("DB not ready (attempt %s/%s)", attempt, retries)
            time.sleep(delay)
    raise RuntimeError("Database is not available")


def run_migrations() -> None:
    cfg = Config(str(API_ROOT / "alembic.ini"))
    cfg.set_main_option("script_location", str(API_ROOT / "alembic"))
    logger.info("Applying migrations...")
    command.upgrade(cfg, "head")
    logger.info("Migrations are up to date")
