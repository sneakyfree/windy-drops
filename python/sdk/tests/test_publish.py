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
