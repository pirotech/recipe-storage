from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class MagicLinkRequest(BaseModel):
    email: EmailStr


class VerifyRequest(BaseModel):
    token: str = Field(min_length=1, max_length=200)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1, max_length=200)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int = Field(description="Срок жизни access-токена в секундах")


class MessageResponse(BaseModel):
    message: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str | None
    telegram_username: str | None
    created_at: datetime


class TelegramStartResponse(BaseModel):
    bot_url: str
    poll_token: str
    expires_in: int = Field(description="Сколько секунд ссылка действует")


class TelegramPollRequest(BaseModel):
    poll_token: str = Field(min_length=1, max_length=200)


class TelegramPollResponse(BaseModel):
    status: Literal["pending", "confirmed", "expired"]
    tokens: TokenResponse | None = None


class TelegramConfirmRequest(BaseModel):
    token: str = Field(min_length=1, max_length=200)
    telegram_id: int
    username: str | None = Field(default=None, max_length=64)
