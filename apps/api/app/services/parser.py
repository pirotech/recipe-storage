import html
import logging
from collections.abc import Callable
from dataclasses import dataclass
from urllib.parse import urlsplit

from recipe_scrapers import NoSchemaFoundInWildMode, WebsiteNotImplementedError, scrape_html

from app.schemas.recipe import Ingredient, Step
from app.services.errors import ParseError

logger = logging.getLogger("uvicorn.error")

MAX_ITEMS = 200  # защита от мусорных страниц с тысячами «ингредиентов»


@dataclass
class ParsedRecipe:
    title: str
    ingredients: list[Ingredient]
    steps: list[Step]
    image_url: str | None = None
    servings: str | None = None
    total_time_minutes: int | None = None


def _optional(getter: Callable):
    """Необязательные поля у библиотеки при отсутствии данных бросают исключения."""
    try:
        return getter()
    except Exception:
        return None


def _http_url(value) -> str | None:
    # Картинку потом покажет фронт, поэтому пропускаем только http(s):
    # так не пролезут javascript: и data: ссылки.
    if isinstance(value, str) and urlsplit(value).scheme in ("http", "https"):
        return value
    return None


def get_steps(scraper, url: str) -> list[Step]:
    steps = []
    if "pinchofyum.com" in url or "vkusvill.ru" in url or "food.ru" in url:
        raw = scraper.schema.data.get("recipeInstructions") or []
        for item in raw:
            if isinstance(item, str):
                steps.append(html.unescape(item).strip())
            elif item.get("@type") == "HowToStep":
                name = html.unescape(item.get("name") or "").strip()
                text = html.unescape(item.get("text") or "").strip()
                steps.append(f"{name}: {text}" if name and name != text else text)
            elif item.get("@type") == "HowToSection":
                for sub in item.get("itemListElement", []):
                    name = html.unescape(sub.get("name") or "").strip()
                    text = html.unescape(sub.get("text") or "").strip()
                    steps.append(f"{name}: {text}" if name and name != text else text)
        logger.info("From handle parse: %r", steps)
    else:
        steps = _optional(scraper.instructions_list) or []
        logger.info("From instructions_list(): %r", steps)
        if not steps:
            text = _optional(scraper.instructions) or ""
            steps = text.splitlines()
            logger.info("From instructions(): %r", steps)
    return [Step(text=s.strip()) for s in steps if isinstance(s, str) and s.strip()]


def parse_recipe(html: str, url: str) -> ParsedRecipe:
    try:
        scraper = scrape_html(html, org_url=url, supported_only=False)
    except (NoSchemaFoundInWildMode, WebsiteNotImplementedError) as e:
        raise ParseError("На странице не найден рецепт") from e
    except Exception as e:  # у библиотеки много разных исключений: не роняем сервер 500-й
        logger.warning("Recipe parsing failed for %s: %r", url, e)
        raise ParseError("Не удалось распознать рецепт на странице") from e

    title = _optional(scraper.title)
    raw_ingredients = _optional(scraper.ingredients) or []
    ingredients = [
        Ingredient(raw=i.strip()) for i in raw_ingredients if isinstance(i, str) and i.strip()
    ]
    if not title or not ingredients:
        raise ParseError("На странице не найден рецепт")

    steps = get_steps(scraper, url)

    servings = _optional(scraper.yields)
    total_time = _optional(scraper.total_time)

    return ParsedRecipe(
        title=title.strip(),
        ingredients=ingredients[:MAX_ITEMS],
        steps=steps[:MAX_ITEMS],
        image_url=_http_url(_optional(scraper.image)),
        servings=servings[:100] if isinstance(servings, str) else None,  # колонка String(100)
        total_time_minutes=total_time if isinstance(total_time, int) and total_time >= 0 else None,
    )
