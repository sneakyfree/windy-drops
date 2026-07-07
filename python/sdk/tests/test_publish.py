"""tests/test_publish.py — WD-8 acceptance tests for `windy-drops publish`."""

from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

import httpx
import pytest

from windy_drops.lib.registry import (
    PublishedDrop,
    RegistryError,
    publish_to_registry,
    resolve_registry_url,
)

ROOT = Path(__file__).resolve().parent.parent


def run(*args: str, env_extra: dict[str, str] | None = None) -> subprocess.CompletedProcess[str]:
    import os
    env = dict(os.environ)
    env.pop("WINDY_REGISTRY_TOKEN", None)
    if env_extra:
        env.update(env_extra)
    return subprocess.run(
        [sys.executable, "-m", "windy_drops.cli", *args],
        capture_output=True,
        text=True,
        cwd=ROOT,
        env=env,
    )


def test_publish_dry_run_prints_payload() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        drop = Path(tmp) / "d"
        assert run("new", "--type", "skill", str(drop)).returncode == 0
        r = run("publish", str(drop), "--dry-run", "--registry-url", "http://nowhere")
        assert r.returncode == 0, r.stderr
        assert "dry-run" in r.stdout
        assert "bundle_sha256" in r.stdout


def test_publish_requires_token_when_not_dry_run() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        drop = Path(tmp) / "d"
        assert run("new", "--type", "skill", str(drop)).returncode == 0
        r = run("publish", str(drop), "--registry-url", "http://nowhere.invalid")
        assert r.returncode == 2
        assert "Bearer" in r.stderr


def test_resolve_registry_url_priority(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("WINDY_REGISTRY_URL", raising=False)
    assert resolve_registry_url(registry_url="https://foo") == "https://foo"
    assert resolve_registry_url(registry_url="https://foo/") == "https://foo"
    monkeypatch.setenv("WINDY_REGISTRY_URL", "https://bar/")
    assert resolve_registry_url() == "https://bar"


def test_publish_to_registry_posts_json_with_bearer(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["method"] = request.method
        captured["headers"] = dict(request.headers)
        captured["body"] = request.read().decode()
        return httpx.Response(
            201,
            json={
                "drop_id": "test-drop",
                "version": "1.0.0",
                "manifest": {"id": "test-drop"},
                "bundle_url": "https://drops/test.zip",
                "bundle_sha256": "a" * 64,
                "signature_verified": False,
                "signer_passport": None,
                "signer_integrity_band": None,
                "signer_clearance_level": None,
                "published_at": "2026-05-21T00:00:00Z",
            },
        )

    real_post = httpx.post
    def fake_post(url: str, **kwargs: Any) -> httpx.Response:
        request = httpx.Request("POST", url, **{k: v for k, v in kwargs.items() if k != "timeout"})
        return handler(request)

    monkeypatch.setattr(httpx, "post", fake_post)

    result = publish_to_registry(
        registry_url="https://api.windydrops.com",
        bearer_token="fake-jwt",
        payload={
            "manifest": {"id": "test-drop"},
            "bundle_url": "https://drops/test.zip",
            "bundle_sha256": "a" * 64,
        },
    )

    assert captured["url"] == "https://api.windydrops.com/api/v1/drops"
    assert captured["method"] == "POST"
    assert captured["headers"]["authorization"] == "Bearer fake-jwt"
    body = __import__("json").loads(captured["body"])
    assert body["manifest"]["id"] == "test-drop"
    assert isinstance(result, PublishedDrop)
    assert result.drop_id == "test-drop"


def test_publish_to_registry_raises_on_4xx(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_post(url: str, **kwargs: Any) -> httpx.Response:
        return httpx.Response(409, json={"detail": {"error": "version_already_published"}})

    monkeypatch.setattr(httpx, "post", fake_post)

    with pytest.raises(RegistryError) as exc_info:
        publish_to_registry(
            registry_url="https://api",
            bearer_token="x",
            payload={"manifest": {}, "bundle_url": "https://x", "bundle_sha256": "a" * 64},
        )
    assert exc_info.value.status == 409
    assert exc_info.value.body == {"detail": {"error": "version_already_published"}}


# F15 dependency: fetch_drop() helper exists + handles 404 / 200 / 5xx
def test_fetch_drop_returns_none_on_404(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(httpx, "get", lambda url, **_: httpx.Response(404))
    from windy_drops.lib.registry import fetch_drop
    assert fetch_drop(registry_url="https://api", drop_id="x") is None


def test_fetch_drop_returns_dict_on_200(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        httpx, "get",
        lambda url, **_: httpx.Response(200, json={"id": "x", "withdrawn_at": None}),
    )
    from windy_drops.lib.registry import fetch_drop
    body = fetch_drop(registry_url="https://api", drop_id="x")
    assert body == {"id": "x", "withdrawn_at": None}


def test_fetch_drop_raises_on_5xx(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(httpx, "get", lambda url, **_: httpx.Response(500, text="boom"))
    from windy_drops.lib.registry import RegistryError, fetch_drop
    with pytest.raises(RegistryError) as exc:
        fetch_drop(registry_url="https://api", drop_id="x")
    assert exc.value.status == 500


def test_upload_bundle_bytes_puts_zip_and_returns_keys(monkeypatch: pytest.MonkeyPatch) -> None:
    from windy_drops.lib.registry import upload_bundle_bytes

    calls: list[dict[str, Any]] = []

    def fake_put(url: str, *, content: bytes, headers: dict[str, str], timeout: float):
        calls.append({"url": url, "content": content, "headers": headers})
        return httpx.Response(
            200, json={"uploaded": ["d/1.0.0/d-1.0.0.zip", "d/1.0.0/SKILL.md"]}
        )

    monkeypatch.setattr(httpx, "put", fake_put)
    keys = upload_bundle_bytes(
        registry_url="https://reg.example",
        bearer_token="tok",
        drop_id="d",
        version="1.0.0",
        zip_bytes=b"PK\x03\x04",
    )
    assert keys == ["d/1.0.0/d-1.0.0.zip", "d/1.0.0/SKILL.md"]
    assert calls[0]["url"] == "https://reg.example/api/v1/drops/d/versions/1.0.0/bundle"
    assert calls[0]["headers"]["authorization"] == "Bearer tok"
    assert calls[0]["headers"]["content-type"] == "application/zip"
    assert calls[0]["content"] == b"PK\x03\x04"


def test_upload_bundle_bytes_raises_registry_error_on_4xx(monkeypatch: pytest.MonkeyPatch) -> None:
    from windy_drops.lib.registry import upload_bundle_bytes

    def fake_put(url: str, *, content: bytes, headers: dict[str, str], timeout: float):
        return httpx.Response(422, json={"detail": {"error": "bundle_sha_mismatch"}})

    monkeypatch.setattr(httpx, "put", fake_put)
    with pytest.raises(RegistryError) as exc:
        upload_bundle_bytes(
            registry_url="https://reg.example",
            bearer_token="tok",
            drop_id="d",
            version="1.0.0",
            zip_bytes=b"x",
        )
    assert exc.value.status == 422
