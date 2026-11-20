from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from sqlalchemy import func, select, update

from app.api.deps import CurrentUser, DbSession
from app.core.config import get_settings
from app.core.security import create_access_token, generate_token, hash_token
from app.db.models import LoginToken, RefreshToken, User
from app.schemas.auth import (
    MagicLinkRequest,
    MessageResponse,
    RefreshRequest,
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


@router.post(
    "/magic-link", status_code=status.HTTP_202_ACCEPTED, response_model=MessageResponse
)
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
            detail={"code": "too_many_requests", "message": "Слишком много запросов, попробуйте позже"},
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
