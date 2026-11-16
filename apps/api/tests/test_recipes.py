from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_create_recipe():
    r = client.post("/api/recipes", json={"url": "https://example.com/borscht"})
    assert r.status_code == 201
    assert r.json()["source_url"] == "https://example.com/borscht"


def test_create_recipe_invalid_url():
    r = client.post("/api/recipes", json={"url": "not-a-url"})
    assert r.status_code == 422


def test_get_recipe_invalid_id():
    assert client.get("/api/recipes/123").status_code == 422


def test_update_recipe():
    rid = str(uuid4())
    r = client.patch(f"/api/recipes/{rid}", json={"title": "Новое название"})
    assert r.status_code == 200
    assert r.json()["title"] == "Новое название"


def test_delete_recipe():
    assert client.delete(f"/api/recipes/{uuid4()}").status_code == 204
