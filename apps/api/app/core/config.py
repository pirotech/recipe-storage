from functools import lru_cache
from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEV_SECRET = "dev-only-secret-change-me"


class Settings(BaseSettings):
    app_name: str = "Recipe storage API"
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:5173"]
    database_url: str = "postgresql+psycopg://recipes:recipes@localhost:5432/recipes"

    @field_validator("database_url")
    @classmethod
    def use_psycopg_driver(cls, v: str) -> str:
        for prefix in ("postgres://", "postgresql://"):
            if v.startswith(prefix):
                return "postgresql+psycopg://" + v[len(prefix) :]
        return v

    secret_key: str = DEV_SECRET
    access_token_minutes: int = 15
    refresh_token_days: int = 30
    magic_link_minutes: int = 15
    frontend_url: str = "http://localhost:5173"

    email_backend: Literal["console", "smtp"] = "console"
    email_from: str = "Recipes <noreply@localhost>"
    smtp_host: str = "localhost"
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_starttls: bool = True

    @model_validator(mode="after")
    def check_production_settings(self):
        if not self.debug:
            if self.secret_key == DEV_SECRET or len(self.secret_key) < 32:
                raise ValueError("SECRET_KEY must be set (32+ chars) when DEBUG is off")
            # if self.email_backend == "console":
            #     raise ValueError("EMAIL_BACKEND=smtp is required when DEBUG is off")
        return self

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
