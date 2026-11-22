import ipaddress
import socket
import time
from urllib.parse import urljoin, urlsplit

import httpx

from app.services.errors import FetchError

MAX_BYTES = 3 * 1024 * 1024  # максимум 3 МБ HTML
MAX_REDIRECTS = 5
TOTAL_TIMEOUT = 20.0  # секунд на всю загрузку целиком
ALLOWED_PORTS = (80, 443)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; RecipesApp/0.1)",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "ru,en;q=0.8",
}


def _resolve_ips(host: str, port: int) -> list[str]:
    try:
        infos = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    except socket.gaierror as e:
        raise FetchError("dns_error", "Не удалось найти сайт по этому адресу") from e
    return [info[4][0] for info in infos]


def _is_public(ip_str: str) -> bool:
    ip = ipaddress.ip_address(ip_str)
    if ip.version == 6 and ip.ipv4_mapped:  # ::ffff:127.0.0.1 → 127.0.0.1
        ip = ip.ipv4_mapped
    return ip.is_global and not ip.is_multicast


def check_url(url: str) -> None:
    """Бросает FetchError, если по этому адресу ходить нельзя."""
    parts = urlsplit(url)
    if parts.scheme not in ("http", "https") or not parts.hostname:
        raise FetchError("bad_url", "Поддерживаются только ссылки http и https")
    try:
        port = parts.port or (443 if parts.scheme == "https" else 80)
    except ValueError as e:
        raise FetchError("bad_url", "Некорректный порт в ссылке") from e
    if port not in ALLOWED_PORTS:
        raise FetchError("bad_url", "Допустимы только порты 80 и 443")

    for ip in _resolve_ips(parts.hostname, port):
        if not _is_public(ip):
            raise FetchError("forbidden_host", "Этот адрес недоступен для импорта")


def _decode(body: bytes, charset: str | None) -> str:
    try:
        return body.decode(charset or "utf-8", errors="replace")
    except LookupError:  # сервер указал неизвестную кодировку
        return body.decode("utf-8", errors="replace")


def _read_limited(resp: httpx.Response, deadline: float) -> bytes:
    chunks: list[bytes] = []
    total = 0
    for chunk in resp.iter_bytes():
        total += len(chunk)
        if total > MAX_BYTES:
            raise FetchError("too_large", "Страница слишком большая")
        if time.monotonic() > deadline:
            raise FetchError("timeout", "Сайт отвечает слишком медленно")
        chunks.append(chunk)
    return b"".join(chunks)


def fetch_html(url: str, client: httpx.Client | None = None) -> str:
    own_client = client is None
    if client is None:
        client = httpx.Client(
            timeout=httpx.Timeout(10.0, connect=5.0),
            headers=HEADERS,
            follow_redirects=False,  # редиректы ведём сами, см. ниже
        )
    deadline = time.monotonic() + TOTAL_TIMEOUT
    try:
        current = url
        for _ in range(MAX_REDIRECTS + 1):
            check_url(current)  # проверяем КАЖДЫЙ адрес в цепочке
            try:
                with client.stream("GET", current) as resp:
                    if resp.is_redirect:
                        current = urljoin(current, resp.headers["location"])
                        continue
                    if resp.status_code >= 400:
                        raise FetchError(
                            "upstream_error", f"Сайт ответил ошибкой {resp.status_code}"
                        )
                    if "html" not in resp.headers.get("content-type", "").lower():
                        raise FetchError("not_html", "По ссылке находится не веб-страница")
                    body = _read_limited(resp, deadline)
                    return _decode(body, resp.charset_encoding)
            except httpx.TimeoutException as e:
                raise FetchError("timeout", "Сайт не ответил вовремя") from e
            except httpx.HTTPError as e:
                raise FetchError("network_error", "Не удалось загрузить страницу") from e
        raise FetchError("too_many_redirects", "Слишком много перенаправлений")
    finally:
        if own_client:
            client.close()
