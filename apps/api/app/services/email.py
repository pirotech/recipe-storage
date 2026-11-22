import logging
import smtplib
from email.message import EmailMessage

from app.core.config import get_settings

logger = logging.getLogger("uvicorn.error")


def send_magic_link(email: str, link: str) -> None:
    settings = get_settings()

    if settings.email_backend == "console":
        # Только для разработки: ссылка с токеном попадает в логи.
        logger.info("MAGIC LINK for %s: %s", email, link)
        return

    msg = EmailMessage()
    msg["From"] = settings.email_from
    msg["To"] = email
    msg["Subject"] = "Вход в Recipes"
    msg.set_content(
        f"Чтобы войти, откройте ссылку:\n\n{link}\n\n"
        f"Она действует {settings.magic_link_minutes} минут и работает один раз.\n"
        "Если вы не запрашивали вход, просто проигнорируйте это письмо."
    )
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
            if settings.smtp_starttls:
                smtp.starttls()
            if settings.smtp_user:
                smtp.login(settings.smtp_user, settings.smtp_password or "")
            smtp.send_message(msg)
    except Exception:
        # Письмо уходит в фоне, поэтому клиент ошибки уже не увидит. Пишем в лог.
        logger.exception("Failed to send magic link to %s", email)
