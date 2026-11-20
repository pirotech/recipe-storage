from datetime import UTC, datetime, timedelta

import jwt

from app.core.config import get_settings
from app.core.security import hash_token
from app.db.models import LoginToken


def _login(client, outbox, email="carol@example.com"):
    assert client.post("/api/auth/magic-link", json={"email": email}).status_code == 202
    token = outbox[-1][1].split("#token=")[1]
    r = client.post("/api/auth/verify", json={"token": token})
    assert r.status_code == 200
    return token, r.json()


def _bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_login_flow(anon_client, outbox):
    _, tokens = _login(anon_client, outbox)
    assert tokens["token_type"] == "bearer"
    me = anon_client.get("/api/auth/me", headers=_bearer(tokens["access_token"]))
    assert me.status_code == 200
    assert me.json()["email"] == "carol@example.com"


def test_email_is_normalized(anon_client, outbox):
    anon_client.post("/api/auth/magic-link", json={"email": "Carol@Example.COM"})
    assert outbox[0][0] == "carol@example.com"


def test_magic_link_is_single_use(anon_client, outbox):
    token, _ = _login(anon_client, outbox)
    assert anon_client.post("/api/auth/verify", json={"token": token}).status_code == 401


def test_expired_magic_link(anon_client, db_session):
    db_session.add(
        LoginToken(
            email="x@example.com",
            token_hash=hash_token("old"),
            expires_at=datetime.now(UTC) - timedelta(minutes=1),
        )
    )
    db_session.commit()
    assert anon_client.post("/api/auth/verify", json={"token": "old"}).status_code == 401


def test_unknown_magic_link(anon_client):
    assert anon_client.post("/api/auth/verify", json={"token": "nope"}).status_code == 401


def test_magic_link_rate_limit(anon_client, outbox):
    codes = [
        anon_client.post("/api/auth/magic-link", json={"email": "spam@example.com"}).status_code
        for _ in range(6)
    ]
    assert codes == [202] * 5 + [429]


def test_refresh_rotates_token(anon_client, outbox):
    _, tokens = _login(anon_client, outbox)
    old = tokens["refresh_token"]
    r = anon_client.post("/api/auth/refresh", json={"refresh_token": old})
    assert r.status_code == 200
    assert r.json()["refresh_token"] != old
    # старый refresh-токен после ротации не работает
    assert anon_client.post("/api/auth/refresh", json={"refresh_token": old}).status_code == 401


def test_logout_revokes_refresh_token(anon_client, outbox):
    _, tokens = _login(anon_client, outbox)
    body = {"refresh_token": tokens["refresh_token"]}
    assert anon_client.post("/api/auth/logout", json=body).status_code == 204
    assert anon_client.post("/api/auth/refresh", json=body).status_code == 401


def test_me_requires_token(anon_client):
    assert anon_client.get("/api/auth/me").status_code == 401


def test_garbage_token_rejected(anon_client):
    assert anon_client.get("/api/auth/me", headers=_bearer("garbage")).status_code == 401


def test_expired_access_token_rejected(anon_client, outbox):
    _, tokens = _login(anon_client, outbox)
    # настоящий токен работает...
    ok = anon_client.get("/api/auth/me", headers=_bearer(tokens["access_token"]))
    assert ok.status_code == 200
    # ...а такой же, но просроченный, нет
    sub = jwt.decode(tokens["access_token"], options={"verify_signature": False})["sub"]
    expired = jwt.encode(
        {"sub": sub, "type": "access", "exp": datetime.now(UTC) - timedelta(minutes=1)},
        get_settings().secret_key,
        algorithm="HS256",
    )
    assert anon_client.get("/api/auth/me", headers=_bearer(expired)).status_code == 401
