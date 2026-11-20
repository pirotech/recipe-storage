from uuid import uuid4
import pytest

from app.services.errors import FetchError
from tests.samples import NO_RECIPE_HTML

def _create(client, url="https://example.com/borscht"):
    r = client.post("/api/recipes", json={"url": url})
    assert r.status_code == 201
    return r.json()


def test_create_and_get(client):
    created = _create(client)
    assert created["source_url"] == "https://example.com/borscht"

    r = client.get(f"/api/recipes/{created['id']}")
    assert r.status_code == 200
    assert r.json() == created


def test_create_invalid_url(client):
    assert client.post("/api/recipes", json={"url": "not-a-url"}).status_code == 422


def test_list_newest_first(client):
    first = _create(client, "https://example.com/a")
    second = _create(client, "https://example.com/b")
    ids = [r["id"] for r in client.get("/api/recipes").json()]
    assert ids == [second["id"], first["id"]]


def test_get_not_found(client):
    assert client.get(f"/api/recipes/{uuid4()}").status_code == 404


def test_get_invalid_id(client):
    assert client.get("/api/recipes/123").status_code == 422


def test_update(client):
    rid = _create(client)["id"]
    r = client.patch(
        f"/api/recipes/{rid}",
        json={
            "title": "Борщ",
            "ingredients": [{"raw": "2 свеклы", "name": "свёкла", "amount": 2}],
        },
    )
    assert r.status_code == 200
    assert r.json()["title"] == "Борщ"
    # изменения реально сохранились в БД
    saved = client.get(f"/api/recipes/{rid}").json()
    assert saved["ingredients"][0]["raw"] == "2 свеклы"


def test_update_title_null_rejected(client):
    rid = _create(client)["id"]
    r = client.patch(f"/api/recipes/{rid}", json={"title": None})
    assert r.status_code == 422


def test_update_not_found(client):
    r = client.patch(f"/api/recipes/{uuid4()}", json={"title": "x"})
    assert r.status_code == 404


def test_delete(client):
    rid = _create(client)["id"]
    assert client.delete(f"/api/recipes/{rid}").status_code == 204
    assert client.get(f"/api/recipes/{rid}").status_code == 404


def test_delete_not_found(client):
    assert client.delete(f"/api/recipes/{uuid4()}").status_code == 404

def test_create_saves_parsed_data(client):
    r = client.post("/api/recipes", json={"url": "https://example.com/pancakes"})
    assert r.status_code == 201
    body = r.json()
    assert body["title"] == "Блины на молоке"
    assert len(body["ingredients"]) == 3
    assert len(body["steps"]) == 2


def test_duplicate_url_returns_existing(client):
    first = client.post("/api/recipes", json={"url": "https://example.com/pancakes"})
    second = client.post(
        "/api/recipes", json={"url": "https://example.com/pancakes/?utm_source=telegram"}
    )
    assert second.status_code == 200
    assert second.json()["id"] == first.json()["id"]
    assert len(client.get("/api/recipes").json()) == 1


def test_page_without_recipe(client, monkeypatch):
    monkeypatch.setattr("app.api.recipes.fetch_html", lambda url: NO_RECIPE_HTML)
    r = client.post("/api/recipes", json={"url": "https://example.com/blog"})
    assert r.status_code == 422
    assert r.json()["detail"]["code"] == "recipe_not_found"
    assert client.get("/api/recipes").json() == []  # ничего не сохранилось


def test_fetch_timeout_maps_to_504(client, monkeypatch):
    def boom(url):
        raise FetchError("timeout", "Сайт не ответил вовремя")

    monkeypatch.setattr("app.api.recipes.fetch_html", boom)
    r = client.post("/api/recipes", json={"url": "https://example.com/slow"})
    assert r.status_code == 504
