from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import DbSession
from app.db.models import Recipe
from app.schemas.recipe import RecipeCreate, RecipeRead, RecipeUpdate

router = APIRouter(tags=["recipes"])


def _get_or_404(db: DbSession, recipe_id: UUID) -> Recipe:
    recipe = db.get(Recipe, recipe_id)
    if recipe is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recipe not found")
    return recipe


@router.post("", response_model=RecipeRead, status_code=status.HTTP_201_CREATED)
def create_recipe(payload: RecipeCreate, db: DbSession) -> Recipe:
    # TODO (шаг 5): здесь будет вызов парсера. Пока сохраняем «болванку».
    recipe = Recipe(
        source_url=str(payload.url),
        title=payload.url.host or str(payload.url),
        ingredients=[],
        steps=[],
    )
    db.add(recipe)
    db.commit()
    db.refresh(recipe)
    return recipe


@router.get("", response_model=list[RecipeRead])
def list_recipes(db: DbSession) -> list[Recipe]:
    stmt = select(Recipe).order_by(Recipe.created_at.desc())
    return list(db.scalars(stmt))


@router.get("/{recipe_id}", response_model=RecipeRead)
def get_recipe(recipe_id: UUID, db: DbSession) -> Recipe:
    return _get_or_404(db, recipe_id)


@router.patch("/{recipe_id}", response_model=RecipeRead)
def update_recipe(recipe_id: UUID, payload: RecipeUpdate, db: DbSession) -> Recipe:
    recipe = _get_or_404(db, recipe_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(recipe, field, value)
    db.commit()
    return recipe


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipe(recipe_id: UUID, db: DbSession) -> None:
    recipe = _get_or_404(db, recipe_id)
    db.delete(recipe)
    db.commit()
