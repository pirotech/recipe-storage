from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl


class Ingredient(BaseModel):
    raw: str = Field(description="Исходная строка, например «2 ст. л. муки»")
    name: str | None = None
    amount: float | None = None
    unit: str | None = None


class Step(BaseModel):
    text: str
    image_url: str | None = None


class RecipeCreate(BaseModel):
    url: HttpUrl


class RecipeUpdate(BaseModel):
    title: str | None = None
    image_url: str | None = None
    servings: str | None = None
    total_time_minutes: int | None = Field(default=None, ge=0)
    ingredients: list[Ingredient] | None = None
    steps: list[Step] | None = None


class RecipeRead(BaseModel):
    id: UUID
    source_url: str
    title: str
    image_url: str | None = None
    servings: str | None = None
    total_time_minutes: int | None = None
    ingredients: list[Ingredient]
    steps: list[Step]
    created_at: datetime
