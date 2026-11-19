import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings
from app.db import models  # noqa: F401  (регистрирует модели в metadata)
from app.db.base import Base
from app.db.session import get_db
from app.main import app


def _test_db_url():
    url = make_url(get_settings().database_url)
    return url.set(database=f"{url.database}_test")


@pytest.fixture(scope="session")
def engine():
    test_url = _test_db_url()

    # создаём тестовую БД, если её ещё нет
    admin = create_engine(get_settings().database_url, isolation_level="AUTOCOMMIT")
    with admin.connect() as conn:
        exists = conn.scalar(
            text("SELECT 1 FROM pg_database WHERE datname = :n"), {"n": test_url.database}
        )
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{test_url.database}"'))
    admin.dispose()

    eng = create_engine(test_url)
    Base.metadata.create_all(eng)
    yield eng
    Base.metadata.drop_all(eng)
    eng.dispose()


@pytest.fixture
def client(engine):
    TestSession = sessionmaker(engine, expire_on_commit=False)

    def override_get_db():
        with TestSession() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)  # без `with`: lifespan (миграции) не запускается
    app.dependency_overrides.clear()

    with engine.begin() as conn:  # чистим данные после каждого теста
        conn.execute(text("TRUNCATE recipes"))
