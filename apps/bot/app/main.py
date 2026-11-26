import hmac
import logging

from fastapi import FastAPI, Header, HTTPException, Request

from app import telegram
from app.api_client import confirm_login
from app.config import get_settings

logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="Recipes bot")

CONFIRM_PREFIX = "ok:"
CANCEL_DATA = "no"


@app.get("/bot/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/bot/webhook")
async def webhook(
    request: Request,
    secret: str | None = Header(default=None, alias="X-Telegram-Bot-Api-Secret-Token"),
) -> dict:
    # Telegram присылает наш секрет в этом заголовке. Без проверки любой мог бы
    # отправить на этот адрес поддельный «апдейт» с чужим telegram_id.
    expected = get_settings().telegram_webhook_secret
    if secret is None or not hmac.compare_digest(secret, expected):
        raise HTTPException(403, "forbidden")

    update = await request.json()
    try:
        if "message" in update:
            handle_message(update["message"])
        elif "callback_query" in update:
            handle_callback(update["callback_query"])
    except Exception:
        # Всегда отвечаем 200: иначе Telegram будет бесконечно повторять тот же апдейт
        logger.exception("Failed to handle update")
    return {"ok": True}


def handle_message(msg: dict) -> None:
    chat_id = msg["chat"]["id"]
    text = (msg.get("text") or "").strip()

    # Ссылка t.me/<bot>?start=<token> приходит как «/start <token>»
    if text.startswith("/start "):
        token = text.split(maxsplit=1)[1]
        telegram.send_message(
            chat_id,
            "Запрос на вход в Recipes.\nЕсли это вы — нажмите «Подтвердить». Если нет — «Отмена».",
            reply_markup={
                "inline_keyboard": [
                    [
                        {"text": "✅ Подтвердить", "callback_data": CONFIRM_PREFIX + token},
                        {"text": "Отмена", "callback_data": CANCEL_DATA},
                    ]
                ]
            },
        )
    else:
        telegram.send_message(
            chat_id, "Чтобы войти, нажмите «Войти через Telegram» на сайте Recipes."
        )


def handle_callback(cb: dict) -> None:
    telegram.answer_callback(cb["id"])
    msg = cb["message"]
    chat_id, message_id = msg["chat"]["id"], msg["message_id"]
    data = cb.get("data", "")

    if data.startswith(CONFIRM_PREFIX):
        user = cb["from"]  # кто нажал кнопку: эти данные приходят от Telegram, подделать нельзя
        ok = confirm_login(data.removeprefix(CONFIRM_PREFIX), user["id"], user.get("username"))
        text = (
            "Готово, вы вошли. Можно вернуться на сайт."
            if ok
            else "Ссылка устарела. Начните вход на сайте заново."
        )
    else:
        text = "Вход отменён."
    telegram.edit_message(chat_id, message_id, text)
