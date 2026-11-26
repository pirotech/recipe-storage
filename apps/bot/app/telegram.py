"""Тонкая обёртка над Telegram Bot API: всё это обычные POST-запросы с JSON."""

import httpx

from app.config import get_settings


def _call(method: str, **params) -> None:
    token = get_settings().telegram_bot_token
    r = httpx.post(f"https://api.telegram.org/bot{token}/{method}", json=params, timeout=10)
    r.raise_for_status()


def send_message(chat_id: int, text: str, reply_markup: dict | None = None) -> None:
    params = {"chat_id": chat_id, "text": text}
    if reply_markup:
        params["reply_markup"] = reply_markup
    _call("sendMessage", **params)


def answer_callback(callback_id: str) -> None:
    # Без этого вызова у кнопки в Telegram бесконечно крутится «часики»
    _call("answerCallbackQuery", callback_query_id=callback_id)


def edit_message(chat_id: int, message_id: int, text: str) -> None:
    # reply_markup не передаём: кнопки исчезают, повторно нажать нельзя
    _call("editMessageText", chat_id=chat_id, message_id=message_id, text=text)
