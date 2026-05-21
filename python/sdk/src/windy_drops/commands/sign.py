"""sign command — WD-7. Sign the manifest with the author's Eternitas
Passport key. Writes the signature block back into SKILL.md.
"""

from __future__ import annotations

import hashlib
import re
import sys
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import typer
import yaml

from ..lib.canonical import canonicalize
from ..lib.eternitas import load_credential, sign_es256
from ..lib.skill_md import read_skill_md
from .bundle import bundle as do_bundle

FRONTMATTER_RE = re.compile(
    r"^---\r?\n[\s\S]*?\r?\n---(\r?\n[\s\S]*)?$"
)


@dataclass(frozen=True)
class SignResult:
    passport: str
    signed_digest: str
    signature: str


def sign(
    *,
    path: str,
    key_path: str | None = None,
    passport: str | None = None,
    integrity_band: str | None = None,
    clearance_level: str | None = None,
    bundle_sha256: str | None = None,
) -> SignResult:
    parsed = read_skill_md(path)

    if bundle_sha256 is None:
        tmp_result = do_bundle(path=path, out=f"{parsed.file_path}.signtmp")
        bundle_sha256 = tmp_result.sha256

    cred = load_credential(key_path=key_path)
    passport_eff = passport or cred.passport
    if not passport_eff:
        raise ValueError(
            "no passport in credentials and --passport not supplied. "
            "Provide --passport ET26-XXXX-YYYY or use credentials.json with eternitas.passport set."
        )

    manifest_sans_sig: dict[str, Any] = {k: v for k, v in parsed.frontmatter.items() if k != "signature"}
    canonical = canonicalize(manifest_sans_sig)
    message = canonical + bundle_sha256

    digest = "sha256:" + hashlib.sha256(message.encode("utf-8")).hexdigest()
    signature = sign_es256(message, cred.private_key)

    sig_block: dict[str, Any] = {
        "algorithm": "ES256",
        "signer": {"passport": passport_eff},
    }
    band = integrity_band or cred.integrity_band
    if band:
        sig_block["signer"]["integrity_band"] = band
    level = clearance_level or cred.clearance_level
    if level:
        sig_block["signer"]["clearance_level"] = level
    sig_block["signed_at"] = (
        datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    )
    sig_block["signed_digest"] = digest
    sig_block["signature"] = signature

    new_frontmatter = {**manifest_sans_sig, "signature": sig_block}
    yaml_dump = yaml.safe_dump(
        new_frontmatter,
        sort_keys=False,
        default_flow_style=False,
        allow_unicode=True,
        width=10_000,
    ).rstrip()

    raw = Path(parsed.file_path).read_text()
    m = FRONTMATTER_RE.match(raw)
    if not m:
        raise RuntimeError(f"SKILL.md frontmatter regex unexpectedly failed for {parsed.file_path}")
    body = m.group(1) or ""
    Path(parsed.file_path).write_text(f"---\n{yaml_dump}\n---{body}", encoding="utf-8")

    return SignResult(passport=passport_eff, signed_digest=digest, signature=signature)


def run(
    path: str = typer.Argument(..., help="Drop directory"),
    key: str | None = typer.Option(None, "--key", help="Explicit path to EC P-256 private key PEM"),
    passport: str | None = typer.Option(None, "--passport", help="Eternitas passport id"),
    integrity_band: str | None = typer.Option(None, "--integrity-band", help="critical|poor|fair|good|exceptional"),
    clearance_level: str | None = typer.Option(None, "--clearance-level", help="Snapshot clearance level"),
) -> None:
    """Sign the manifest with the author's Eternitas Passport (ES256)."""
    try:
        result = sign(
            path=path,
            key_path=key,
            passport=passport,
            integrity_band=integrity_band,
            clearance_level=clearance_level,
        )
    except (ValueError, FileNotFoundError, RuntimeError) as e:
        typer.echo(f"✗ {e}", err=True)
        sys.exit(1)
    typer.echo(f"✓ signed by {result.passport}")
    typer.echo(f"  digest:    {result.signed_digest}")
    typer.echo(f"  signature: {result.signature[:16]}...")
