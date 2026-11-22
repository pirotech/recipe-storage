import pytest

from app.services.errors import ParseError
from app.services.parser import parse_recipe
from tests.samples import NO_RECIPE_HTML, SAMPLE_RECIPE_HTML

URL = "https://example.com/pancakes"


def test_parse_json_ld():
    r = parse_recipe(SAMPLE_RECIPE_HTML, URL)
    assert r.title == "Блины на молоке"
    assert [i.raw for i in r.ingredients] == ["2 стакана молока", "1 стакан муки", "2 яйца"]
    assert [s.text for s in r.steps] == ["Смешать ингредиенты.", "Жарить с двух сторон."]
    assert r.total_time_minutes == 30
    assert r.image_url == "https://example.com/pancakes.jpg"
    assert r.servings and "4" in r.servings


def test_parse_page_without_recipe():
    with pytest.raises(ParseError):
        parse_recipe(NO_RECIPE_HTML, URL)
