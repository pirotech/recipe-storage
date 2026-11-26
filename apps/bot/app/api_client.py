import httpx

from app.config import get_settings


def confirm_login(token: str, telegram_id: int, username: str | None) -> bool:
    """Просит основной API подтвердить вход. True — подтверждено, False — токен не найден."""
    s = get_settings()
    r = httpx.post(
        f"{s.api_url.rstrip('/')}/auth/telegram/confirm",
        json={"token": token, "telegram_id": telegram_id, "username": username},
        headers={"X-Bot-Secret": s.bot_api_secret},
        timeout=10,
    )
    if r.status_code == 404:
        return False
    r.raise_for_status()
    return True
