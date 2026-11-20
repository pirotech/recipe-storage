from uuid import UUID

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select

from sqlalchemy.exc import IntegrityError
from app.api.deps import CurrentUser, DbSession
from app.db.models import Recipe, User
from app.schemas.recipe import RecipeCreate, RecipeRead, RecipeUpdate
from app.services.errors import RecipeImportError
from app.services.fetcher import fetch_html
from app.services.parser import parse_recipe
from app.services.urls import normalize_url

router = APIRouter(tags=["recipes"])

# Код ошибки импорта → HTTP-статус. Всё, чего нет в таблице, считаем сбоем стороннего сайта (502).
_ERROR_STATUS = {
    "bad_url": 422,
    "forbidden_host": 422,
    "dns_error": 422,
    "recipe_not_found": 422,
    "timeout": 504,
}

def _get_or_404(db: DbSession, recipe_id: UUID, user: User) -> Recipe:
    recipe = db.scalar(
        select(Recipe).where(Recipe.id == recipe_id, Recipe.user_id == user.id)
    )
    if recipe is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recipe not found")
    return recipe


@router.post(
    "",
    response_model=RecipeRead,
    status_code=status.HTTP_201_CREATED,
    responses={200: {"model": RecipeRead, "description": "Рецепт уже есть в коллекции"}},
)
def create_recipe(
    payload: RecipeCreate, db: DbSession, user: CurrentUser, response: Response
) -> Recipe:
    url = str(payload.url)
    key = normalize_url(url)

    def find_existing() -> Recipe | None:
        return db.scalar(
            select(Recipe).where(Recipe.user_id == user.id, Recipe.url_key == key)
        )

    if (existing := find_existing()) is not None:
        response.status_code = status.HTTP_200_OK
        return existing

    try:
        html = fetch_html(url)
        parsed = parse_recipe(html, url)
    except RecipeImportError as e:
        raise HTTPException(
            _ERROR_STATUS.get(e.code, 502), detail={"code": e.code, "message": e.message}
        ) from e

    recipe = Recipe(
        user_id=user.id,
        source_url=url,
        url_key=key,
        title=parsed.title,
        image_url=parsed.image_url,
        servings=parsed.servings,
        total_time_minutes=parsed.total_time_minutes,
        ingredients=[i.model_dump() for i in parsed.ingredients],
        steps=[s.model_dump() for s in parsed.steps],
    )
    db.add(recipe)
    try:
        db.commit()
    except IntegrityError:
        # Гонка: параллельный запрос успел вставить ту же ссылку. Уникальный индекс
        # не дал создать дубль, отдаём то, что уже есть.
        db.rollback()
        existing = find_existing()
        if existing is None:
            raise
        response.status_code = status.HTTP_200_OK
        return existing
    db.refresh(recipe)
    return recipe


@router.get("", response_model=list[RecipeRead])
def list_recipes(db: DbSession, user: CurrentUser) -> list[Recipe]:
    stmt = select(Recipe).where(Recipe.user_id == user.id).order_by(Recipe.created_at.desc())
    return list(db.scalars(stmt))


@router.get("/{recipe_id}", response_model=RecipeRead)
def get_recipe(recipe_id: UUID, db: DbSession, user: CurrentUser) -> Recipe:
    return _get_or_404(db, recipe_id, user)


@router.patch("/{recipe_id}", response_model=RecipeRead)
def update_recipe(
    recipe_id: UUID, payload: RecipeUpdate, db: DbSession, user: CurrentUser
) -> Recipe:
    recipe = _get_or_404(db, recipe_id, user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(recipe, field, value)
    db.commit()
    return recipe


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipe(recipe_id: UUID, db: DbSession, user: CurrentUser) -> None:
    recipe = _get_or_404(db, recipe_id, user)
    db.delete(recipe)
    db.commit()
