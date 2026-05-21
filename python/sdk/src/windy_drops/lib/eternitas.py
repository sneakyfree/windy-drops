"""eternitas.py — local Eternitas Passport signing.

Mirrors packages/sdk/src/lib/eternitas.ts. Reads the EC P-256 private key
from one of:
  --key <path> CLI flag
  $WINDY_PRIVATE_KEY env var (path to PEM)
  ~/.windy/eternitas-private-key.pem
  ~/.windy/credentials.json -> eternitas.private_key

Produces ES256 signatures in raw R||S format (64 bytes -> 88 chars base64).
"""

from __future__ import annotations

import base64
import json
import os
from dataclasses import dataclass
from pathlib import Path

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature
from cryptography.hazmat.primitives.serialization import load_pem_private_key


@dataclass
class EternitasCredential:
    passport: str
    integrity_band: str | None
    clearance_level: str | None
    private_key: ec.EllipticCurvePrivateKey


def load_credential(*, key_path: str | None = None) -> EternitasCredential:
    explicit = key_path or os.environ.get("WINDY_PRIVATE_KEY")
    if explicit:
        return _parse_pem(explicit)

    conventional = Path.home() / ".windy" / "eternitas-private-key.pem"
    if conventional.exists():
        return _parse_pem(str(conventional))

    creds_path = Path.home() / ".windy" / "credentials.json"
    try:
        raw = json.loads(creds_path.read_text())
        e = raw.get("eternitas") or {}
        pk_pem = e.get("private_key")
        if not pk_pem:
            raise ValueError(
                "credentials.json has no eternitas.private_key (you may need to re-issue via `windy connect`)"
            )
        priv = load_pem_private_key(pk_pem.encode("utf-8"), password=None)
        if not isinstance(priv, ec.EllipticCurvePrivateKey):
            raise ValueError("eternitas.private_key is not an EC key")
        return EternitasCredential(
            passport=e.get("passport") or "",
            integrity_band=e.get("integrity_band"),
            clearance_level=e.get("clearance_level"),
            private_key=priv,
        )
    except FileNotFoundError as exc:
        raise FileNotFoundError(
            "no Eternitas credential found. Provide --key <pem>, set $WINDY_PRIVATE_KEY, "
            "place a PEM at ~/.windy/eternitas-private-key.pem, "
            f"or JSON at ~/.windy/credentials.json. ({exc})"
        ) from exc


def _parse_pem(path: str) -> EternitasCredential:
    pem = Path(path).read_bytes()
    priv = load_pem_private_key(pem, password=None)
    if not isinstance(priv, ec.EllipticCurvePrivateKey):
        raise ValueError(f"{path}: not an EC private key")
    return EternitasCredential(
        passport="",
        integrity_band=None,
        clearance_level=None,
        private_key=priv,
    )


def sign_es256(message: str, private_key: ec.EllipticCurvePrivateKey) -> str:
    """Sign a UTF-8 message with ES256, returning base64-encoded raw R||S (88 chars)."""
    der_sig = private_key.sign(message.encode("utf-8"), ec.ECDSA(hashes.SHA256()))
    r, s = decode_dss_signature(der_sig)
    raw = r.to_bytes(32, "big") + s.to_bytes(32, "big")
    return base64.b64encode(raw).decode("ascii")
