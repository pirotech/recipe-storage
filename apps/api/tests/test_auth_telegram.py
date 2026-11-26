import pytest

from app.core.config import get_settings

BOT_HEADERS = {"X-Bot-Secret": "test-bot-secret"}


@pytest.fixture(autouse=True)
def telegram_settings(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "bot_api_secret", "test-bot-secret")
    monkeypatch.setattr(settings, "telegram_bot_username", "test_bot")


def _start(client):
    r = client.post("/api/auth/telegram/start")
    assert r.status_code == 200
    body = r.json()
    return body["bot_url"].split("?start=")[1], body["poll_token"]


def _confirm(client, start_token, telegram_id=111, username="alice", headers=BOT_HEADERS):
    return client.post(
        "/api/auth/telegram/confirm",
        json={"token": start_token, "telegram_id": telegram_id, "username": username},
        headers=headers,
    )


def _poll(client, poll_token):
    return client.post("/api/auth/telegram/poll", json={"poll_token": poll_token}).json()


def test_start_returns_bot_link(anon_client):
    r = anon_client.post("/api/auth/telegram/start")
    assert r.json()["bot_url"].startswith("https://t.me/test_bot?start=")


def test_start_disabled_without_bot_username(anon_client, monkeypatch):
    monkeypatch.setattr(get_settings(), "telegram_bot_username", None)
    assert anon_client.post("/api/auth/telegram/start").status_code == 503


def test_login_flow(anon_client):
    start, poll = _start(anon_client)
    assert _poll(anon_client, poll)["status"] == "pending"

    assert _confirm(anon_client, start).status_code == 204

    result = _poll(anon_client, poll)
    assert result["status"] == "confirmed"
    token = result["tokens"]["access_token"]
    me = anon_client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["telegram_username"] == "alice"
    assert me.json()["email"] is None


def test_session_is_issued_only_once(anon_client):
    start, poll = _start(anon_client)
    _confirm(anon_client, start)
    assert _poll(anon_client, poll)["status"] == "confirmed"
    assert _poll(anon_client, poll)["status"] == "expired"


def test_same_telegram_account_is_same_user(anon_client):
    ids = []
    for _ in range(2):
        start, poll = _start(anon_client)
        _confirm(anon_client, start, telegram_id=222)
        token = _poll(anon_client, poll)["tokens"]["access_token"]
        me = anon_client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        ids.append(me.json()["id"])
    assert ids[0] == ids[1]


def test_confirm_requires_bot_secret(anon_client):
    start, _ = _start(anon_client)
    assert _confirm(anon_client, start, headers={}).status_code == 403
    assert _confirm(anon_client, start, headers={"X-Bot-Secret": "wrong"}).status_code == 403


def test_confirm_disabled_when_secret_not_configured(anon_client, monkeypatch):
    monkeypatch.setattr(get_settings(), "bot_api_secret", None)
    start, _ = _start(anon_client)
    assert _confirm(anon_client, start, headers={"X-Bot-Secret": ""}).status_code == 403


def test_confirm_unknown_token(anon_client):
    assert _confirm(anon_client, "nope").status_code == 404


def test_confirm_is_single_use(anon_client):
    start, _ = _start(anon_client)
    assert _confirm(anon_client, start).status_code == 204
    assert _confirm(anon_client, start, telegram_id=999).status_code == 404


def test_unknown_poll_token_is_expired(anon_client):
    assert _poll(anon_client, "nope")["status"] == "expired"


def test_expired_login(anon_client, monkeypatch):
    monkeypatch.setattr(get_settings(), "telegram_login_minutes", -1)
    start, poll = _start(anon_client)
    assert _confirm(anon_client, start).status_code == 404
    assert _poll(anon_client, poll)["status"] == "expired"
