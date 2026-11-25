from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

NOTES_MAX_LENGTH = 10_000


class Ingredient(BaseModel):
    # Единственное поле: количество, единицы и название разбирает фронт
    raw: str = Field(description="Исходная строка, например «2 ст. л. муки»")


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
    notes: str | None = Field(default=None, max_length=NOTES_MAX_LENGTH)

    @field_validator("title", "ingredients", "steps")
    @classmethod
    def not_null(cls, v):
        if v is None:
            raise ValueError("Поле нельзя обнулить")
        return v


class RecipeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    source_url: str
    title: str
    image_url: str | None = None
    servings: str | None = None
    total_time_minutes: int | None = None
    ingredients: list[Ingredient]
    steps: list[Step]
    notes: str | None = None
    created_at: datetime
