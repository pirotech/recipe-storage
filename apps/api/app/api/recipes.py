from datetime import UTC, datetime
from uuid import UUID, uuid4

from fastapi import APIRouter, status

from app.schemas.recipe import RecipeCreate, RecipeRead, RecipeUpdate

router = APIRouter(tags=["recipes"])


def _stub_recipe(id: UUID | None = None, source_url: str = "https://example.com/pancakes") -> RecipeRead:
    return RecipeRead(
        id=id or uuid4(),
        source_url=source_url,
        title="Блины (заглушка)",
        image_url=None,
        servings="4 порции",
        total_time_minutes=30,
        ingredients=[
            {"raw": "2 стакана молока", "name": "молоко", "amount": 2, "unit": "стакан"},
            {"raw": "1 стакан муки", "name": "мука", "amount": 1, "unit": "стакан"},
            {"raw": "2 яйца", "name": "яйцо", "amount": 2, "unit": None},
        ],
        steps=[
            {"text": "Смешать все ингредиенты до однородного теста."},
            {"text": "Жарить на разогретой сковороде с двух сторон."},
        ],
        created_at=datetime.now(UTC),
    )


@router.post("", response_model=RecipeRead, status_code=status.HTTP_201_CREATED)
def create_recipe(payload: RecipeCreate) -> RecipeRead:
    return _stub_recipe(source_url=str(payload.url))


@router.get("", response_model=list[RecipeRead])
def list_recipes() -> list[RecipeRead]:
    return [_stub_recipe()]


@router.get("/{recipe_id}", response_model=RecipeRead)
def get_recipe(recipe_id: UUID) -> RecipeRead:
    return _stub_recipe(id=recipe_id)


@router.patch("/{recipe_id}", response_model=RecipeRead)
def update_recipe(recipe_id: UUID, payload: RecipeUpdate) -> RecipeRead:
    recipe = _stub_recipe(id=recipe_id)
    return recipe.model_copy(update=payload.model_dump(exclude_unset=True))


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipe(recipe_id: UUID) -> None:
    return None
