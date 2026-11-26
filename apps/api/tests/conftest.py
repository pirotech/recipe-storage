# ruff: noqa: E402
import os

# До импорта app: иначе Settings потребует боевые секреты.
os.environ.setdefault("DEBUG", "true")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings
from app.core.security import create_access_token
from app.db import models  # noqa: F401  (регистрирует модели в metadata)
from app.db.base import Base
from app.db.models import User
from app.db.session import get_db
from app.main import app
from tests.samples import SAMPLE_RECIPE_HTML


def _test_db_url():
    url = make_url(get_settings().database_url)
    return url.set(database=f"{url.database}_test")


@pytest.fixture(scope="session")
def engine():
    test_url = _test_db_url()
    admin = create_engine(get_settings().database_url, isolation_level="AUTOCOMMIT")
    with admin.connect() as conn:
        exists = conn.scalar(
            text("SELECT 1 FROM pg_database WHERE datname = :n"), {"n": test_url.database}
        )
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{test_url.database}"'))
    admin.dispose()

    eng = create_engine(test_url)
    Base.metadata.drop_all(eng)  # чистый старт: схема могла устареть после новых миграций
    Base.metadata.create_all(eng)
    yield eng
    Base.metadata.drop_all(eng)
    eng.dispose()


@pytest.fixture
def session_factory(engine):
    return sessionmaker(engine, expire_on_commit=False)


@pytest.fixture
def db_session(session_factory):
    with session_factory() as session:
        yield session


@pytest.fixture(autouse=True)
def app_db(engine, session_factory):
    """Подменяет БД приложения на тестовую и чистит данные после каждого теста."""

    def override_get_db():
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE users, login_tokens CASCADE"))
        conn.execute(text("TRUNCATE users, login_tokens, telegram_logins CASCADE"))


@pytest.fixture(autouse=True)
def no_network(monkeypatch):
    """Ни один тест не должен реально качать страницы."""
    monkeypatch.setattr("app.api.recipes.fetch_html", lambda url: SAMPLE_RECIPE_HTML)


@pytest.fixture
def outbox(monkeypatch):
    """Перехватывает письма: список пар (email, ссылка)."""
    sent: list[tuple[str, str]] = []
    monkeypatch.setattr("app.api.auth.send_magic_link", lambda e, link: sent.append((e, link)))
    return sent


def _auth_client(session_factory, email: str) -> TestClient:
    with session_factory() as session:
        user = User(email=email)
        session.add(user)
        session.commit()
        token = create_access_token(user.id)
    return TestClient(app, headers={"Authorization": f"Bearer {token}"})


@pytest.fixture
def client(session_factory):
    """Залогиненный пользователь Alice."""
    return _auth_client(session_factory, "alice@example.com")


@pytest.fixture
def other_client(session_factory):
    """Другой залогиненный пользователь Bob."""
    return _auth_client(session_factory, "bob@example.com")


@pytest.fixture
def anon_client():
    return TestClient(app)
