import httpx
import pytest

from app.services import fetcher
from app.services.errors import FetchError

PUBLIC_IP = "93.184.216.34"


@pytest.mark.parametrize(
    "url",
    [
        "file:///etc/passwd",
        "ftp://example.com/x",
        "http://localhost/",
        "http://127.0.0.1/",
        "http://10.0.0.5/",
        "http://169.254.169.254/latest/meta-data/",
        "http://[::1]/",
        "http://example.com:8080/",
    ],
)
def test_check_url_rejects_unsafe(url):
    with pytest.raises(FetchError):
        fetcher.check_url(url)


def _fake_resolve(host, port):
    # для имён возвращаем «публичный» IP, для IP-литералов — их самих
    return [host] if host.replace(".", "").isdigit() else [PUBLIC_IP]


def test_redirect_to_private_ip_is_blocked(monkeypatch):
    monkeypatch.setattr(fetcher, "_resolve_ips", _fake_resolve)

    def handler(request):
        return httpx.Response(302, headers={"location": "http://169.254.169.254/"})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    with pytest.raises(FetchError) as exc:
        fetcher.fetch_html("https://example.com/a", client=client)
    assert exc.value.code == "forbidden_host"


def test_fetch_ok(monkeypatch):
    monkeypatch.setattr(fetcher, "_resolve_ips", _fake_resolve)

    def handler(request):
        return httpx.Response(200, headers={"content-type": "text/html"}, content="<p>привет</p>".encode())

    client = httpx.Client(transport=httpx.MockTransport(handler))
    assert fetcher.fetch_html("https://example.com/a", client=client) == "<p>привет</p>"


def test_too_large(monkeypatch):
    monkeypatch.setattr(fetcher, "_resolve_ips", _fake_resolve)
    monkeypatch.setattr(fetcher, "MAX_BYTES", 100)

    def handler(request):
        return httpx.Response(200, headers={"content-type": "text/html"}, content=b"x" * 1000)

    client = httpx.Client(transport=httpx.MockTransport(handler))
    with pytest.raises(FetchError) as exc:
        fetcher.fetch_html("https://example.com/a", client=client)
    assert exc.value.code == "too_large"
