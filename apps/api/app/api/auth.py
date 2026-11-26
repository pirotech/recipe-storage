import hmac
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, status
from sqlalchemy import func, select, update

from app.api.deps import CurrentUser, DbSession
from app.core.config import get_settings
from app.core.security import create_access_token, generate_token, hash_token
from app.db.models import LoginToken, RefreshToken, TelegramLogin, User
from app.schemas.auth import (
    MagicLinkRequest,
    MessageResponse,
    RefreshRequest,
    TelegramConfirmRequest,
    TelegramPollRequest,
    TelegramPollResponse,
    TelegramStartResponse,
    TokenResponse,
    UserRead,
    VerifyRequest,
)
from app.services.email import send_magic_link

router = APIRouter(tags=["auth"])

MAX_LINKS_PER_HOUR = 5


def _unauthorized(code: str, message: str) -> HTTPException:
    return HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        detail={"code": code, "message": message},
        headers={"WWW-Authenticate": "Bearer"},
    )


def _issue_tokens(db: DbSession, user: User) -> TokenResponse:
    settings = get_settings()
    refresh = generate_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_token(refresh),
            expires_at=datetime.now(UTC) + timedelta(days=settings.refresh_token_days),
        )
    )
    db.commit()  # фиксирует и всё, что было сделано в запросе до этого
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=refresh,
        expires_in=settings.access_token_minutes * 60,
    )


@router.post("/magic-link", status_code=status.HTTP_202_ACCEPTED, response_model=MessageResponse)
def request_magic_link(
    payload: MagicLinkRequest, background: BackgroundTasks, db: DbSession
) -> MessageResponse:
    settings = get_settings()
    email = payload.email.strip().lower()
    now = datetime.now(UTC)

    recent = db.scalar(
        select(func.count())
        .select_from(LoginToken)
        .where(LoginToken.email == email, LoginToken.created_at > now - timedelta(hours=1))
    )
    if recent >= MAX_LINKS_PER_HOUR:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": "too_many_requests",
                "message": "Слишком много запросов, попробуйте позже",
            },
        )

    token = generate_token()
    db.add(
        LoginToken(
            email=email,
            token_hash=hash_token(token),
            expires_at=now + timedelta(minutes=settings.magic_link_minutes),
        )
    )
    db.commit()

    link = f"{settings.frontend_url.rstrip('/')}/auth/verify#token={token}"
    background.add_task(send_magic_link, email, link)
    return MessageResponse(message="Письмо со ссылкой для входа отправлено")


@router.post("/verify", response_model=TokenResponse)
def verify_magic_link(payload: VerifyRequest, db: DbSession) -> TokenResponse:
    now = datetime.now(UTC)

    # Одна атомарная команда: «найти непросроченный неиспользованный токен и пометить
    # использованным». Два параллельных запроса с одним токеном не пройдут оба.
    email = db.scalar(
        update(LoginToken)
        .where(
            LoginToken.token_hash == hash_token(payload.token),
            LoginToken.used_at.is_(None),
            LoginToken.expires_at > now,
        )
        .values(used_at=now)
        .returning(LoginToken.email)
        .execution_options(synchronize_session=False)
    )
    if email is None:
        raise _unauthorized("invalid_link", "Ссылка недействительна или устарела")

    user = db.scalar(select(User).where(User.email == email))
    if user is None:  # первый вход = регистрация
        user = User(email=email)
        db.add(user)
        db.flush()  # получаем user.id, не завершая транзакцию

    return _issue_tokens(db, user)


@router.post("/refresh", response_model=TokenResponse)
def refresh_tokens(payload: RefreshRequest, db: DbSession) -> TokenResponse:
    now = datetime.now(UTC)
    user_id = db.scalar(
        update(RefreshToken)
        .where(
            RefreshToken.token_hash == hash_token(payload.refresh_token),
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > now,
        )
        .values(revoked_at=now)
        .returning(RefreshToken.user_id)
        .execution_options(synchronize_session=False)
    )
    if user_id is None:
        raise _unauthorized("invalid_refresh_token", "Сессия истекла, войдите заново")

    user = db.get(User, user_id)
    if user is None:
        raise _unauthorized("invalid_refresh_token", "Сессия истекла, войдите заново")
    return _issue_tokens(db, user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: RefreshRequest, db: DbSession) -> None:
    db.execute(
        update(RefreshToken)
        .where(
            RefreshToken.token_hash == hash_token(payload.refresh_token),
            RefreshToken.revoked_at.is_(None),
        )
        .values(revoked_at=datetime.now(UTC))
        .execution_options(synchronize_session=False)
    )
    db.commit()


@router.get("/me", response_model=UserRead)
def me(user: CurrentUser) -> User:
    return user


# ---------- Вход через Telegram ----------


@router.post("/telegram/start", response_model=TelegramStartResponse)
def telegram_start(db: DbSession) -> TelegramStartResponse:
    """Шаг 1. Сайт просит начать вход и получает ссылку на бота."""
    settings = get_settings()
    if not settings.telegram_bot_username:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "telegram_disabled", "message": "Вход через Telegram недоступен"},
        )

    start_token = generate_token()
    poll_token = generate_token()
    db.add(
        TelegramLogin(
            start_token_hash=hash_token(start_token),
            poll_token_hash=hash_token(poll_token),
            expires_at=datetime.now(UTC) + timedelta(minutes=settings.telegram_login_minutes),
        )
    )
    db.commit()
    return TelegramStartResponse(
        bot_url=f"https://t.me/{settings.telegram_bot_username}?start={start_token}",
        poll_token=poll_token,
        expires_in=settings.telegram_login_minutes * 60,
    )


@router.post("/telegram/confirm", status_code=status.HTTP_204_NO_CONTENT)
def telegram_confirm(
    payload: TelegramConfirmRequest,
    db: DbSession,
    x_bot_secret: Annotated[str | None, Header()] = None,
) -> None:
    """Шаг 2. Вызывает только бот (не браузер): пользователь нажал «Подтвердить»."""
    expected = get_settings().bot_api_secret
    # compare_digest сравнивает за постоянное время: секрет нельзя подобрать по замерам
    if not expected or x_bot_secret is None or not hmac.compare_digest(x_bot_secret, expected):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Forbidden")

    now = datetime.now(UTC)
    login_id = db.scalar(
        update(TelegramLogin)
        .where(
            TelegramLogin.start_token_hash == hash_token(payload.token),
            TelegramLogin.confirmed_at.is_(None),
            TelegramLogin.expires_at > now,
        )
        .values(
            confirmed_at=now,
            telegram_id=payload.telegram_id,
            telegram_username=payload.username,
        )
        .returning(TelegramLogin.id)
        .execution_options(synchronize_session=False)
    )
    if login_id is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Login not found or expired")
    db.commit()


@router.post("/telegram/poll", response_model=TelegramPollResponse)
def telegram_poll(payload: TelegramPollRequest, db: DbSession) -> TelegramPollResponse:
    """Шаг 3. Браузер раз в пару секунд спрашивает: подтвердили уже или ещё нет?"""
    now = datetime.now(UTC)
    poll_hash = hash_token(payload.poll_token)

    # Атомарно «забираем» подтверждённый вход: сессию по нему выдаём только один раз
    taken = db.execute(
        update(TelegramLogin)
        .where(
            TelegramLogin.poll_token_hash == poll_hash,
            TelegramLogin.confirmed_at.is_not(None),
            TelegramLogin.consumed_at.is_(None),
            TelegramLogin.expires_at > now,
        )
        .values(consumed_at=now)
        .returning(TelegramLogin.telegram_id, TelegramLogin.telegram_username)
        .execution_options(synchronize_session=False)
    ).first()

    if taken is None:
        login = db.scalar(select(TelegramLogin).where(TelegramLogin.poll_token_hash == poll_hash))
        if login is None or login.consumed_at is not None or login.expires_at <= now:
            return TelegramPollResponse(status="expired")
        return TelegramPollResponse(status="pending")

    telegram_id, username = taken
    user = db.scalar(select(User).where(User.telegram_id == telegram_id))
    if user is None:  # первый вход = регистрация
        user = User(telegram_id=telegram_id, telegram_username=username)
        db.add(user)
        db.flush()
    else:
        user.telegram_username = username  # username в Telegram можно сменить

    return TelegramPollResponse(status="confirmed", tokens=_issue_tokens(db, user))
