"""registry.py — HTTP client for the windy-registry service."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any

import httpx


@dataclass(frozen=True)
class PublishedDrop:
    drop_id: str
    version: str
    manifest: dict[str, Any]
    bundle_url: str
    bundle_sha256: str
    signature_verified: bool
    signer_passport: str | None
    signer_integrity_band: str | None
    signer_clearance_level: str | None
    published_at: str


class RegistryError(RuntimeError):
    def __init__(self, message: str, status: int, body: Any) -> None:
        super().__init__(message)
        self.status = status
        self.body = body


def fetch_drop(*, registry_url: str, drop_id: str) -> dict[str, Any] | None:
    """Look up a drop by id. Returns None on 404; raises RegistryError otherwise."""
    url = f"{registry_url}/api/v1/drops/{drop_id}"
    r = httpx.get(url, timeout=15.0)
    if r.status_code == 404:
        return None
    if r.status_code >= 400:
        raise RegistryError(f"registry GET drop: {r.status_code}", r.status_code, r.text)
    return r.json()


def resolve_registry_url(*, registry_url: str | None = None) -> str:
    return (
        (registry_url or os.environ.get("WINDY_REGISTRY_URL") or "https://api.windydrops.com")
        .rstrip("/")
    )


def upload_bundle_bytes(
    *,
    registry_url: str,
    bearer_token: str,
    drop_id: str,
    version: str,
    zip_bytes: bytes,
) -> list[str]:
    """PUT the bundle zip to the registry, which pushes it to R2.

    Returns the list of uploaded object keys. The registry re-verifies the
    SHA-256 against the published version row, so a tampered zip is rejected.
    """
    url = f"{registry_url}/api/v1/drops/{drop_id}/versions/{version}/bundle"
    r = httpx.put(
        url,
        content=zip_bytes,
        headers={
            "authorization": f"Bearer {bearer_token}",
            "content-type": "application/zip",
        },
        timeout=120.0,
    )
    if r.status_code >= 400:
        try:
            body = r.json()
        except Exception:
            body = r.text
        raise RegistryError(
            f"registry rejected bundle upload: {r.status_code}",
            status=r.status_code,
            body=body,
        )
    return r.json().get("uploaded", [])


def publish_to_registry(
    *,
    registry_url: str,
    bearer_token: str,
    payload: dict[str, Any],
) -> PublishedDrop:
    url = f"{registry_url}/api/v1/drops"
    r = httpx.post(
        url,
        json=payload,
        headers={"authorization": f"Bearer {bearer_token}"},
        timeout=30.0,
    )
    if r.status_code >= 400:
        try:
            body = r.json()
        except Exception:
            body = r.text
        raise RegistryError(
            f"registry rejected publish: {r.status_code}",
            status=r.status_code,
            body=body,
        )
    data = r.json()
    return PublishedDrop(
        drop_id=data["drop_id"],
        version=data["version"],
        manifest=data["manifest"],
        bundle_url=data["bundle_url"],
        bundle_sha256=data["bundle_sha256"],
        signature_verified=data["signature_verified"],
        signer_passport=data.get("signer_passport"),
        signer_integrity_band=data.get("signer_integrity_band"),
        signer_clearance_level=data.get("signer_clearance_level"),
        published_at=data["published_at"],
    )
