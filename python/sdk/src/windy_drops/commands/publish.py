"""publish command — WD-8."""

from __future__ import annotations

import json
import os
import sys

import typer

from ..lib.registry import RegistryError, publish_to_registry, resolve_registry_url
from ..lib.skill_md import read_skill_md
from .bundle import bundle as do_bundle

PUBLIC_BUNDLE_DOMAIN = "drops.windydrops.com"


def run(
    path: str = typer.Argument(..., help="Drop directory"),
    registry_url: str | None = typer.Option(None, "--registry-url"),
    token: str | None = typer.Option(None, "--token"),
    bundle_url: str | None = typer.Option(None, "--bundle-url"),
    dry_run: bool = typer.Option(False, "--dry-run"),
) -> None:
    """Validate, bundle, then POST to the registry."""
    try:
        parsed = read_skill_md(path)
        drop_id = parsed.frontmatter["id"]
        version = parsed.frontmatter["version"]

        bundle_result = do_bundle(path=path)
        sha256 = bundle_result.sha256

        url = bundle_url or f"https://{PUBLIC_BUNDLE_DOMAIN}/{drop_id}/{version}/{drop_id}-{version}.zip"

        payload = {
            "manifest": parsed.frontmatter,
            "bundle_url": url,
            "bundle_sha256": sha256,
        }

        if dry_run:
            typer.echo(f"dry-run would POST to {resolve_registry_url(registry_url=registry_url)}/api/v1/drops:")
            typer.echo(json.dumps(payload, indent=2, ensure_ascii=False))
            raise typer.Exit(code=0)

        bearer = token or os.environ.get("WINDY_REGISTRY_TOKEN")
        if not bearer:
            typer.echo(
                "✗ no Bearer token. Pass --token <jwt>, set $WINDY_REGISTRY_TOKEN, "
                "or run `windy connect` to populate ~/.windy/credentials.json",
                err=True,
            )
            raise typer.Exit(code=2)

        result = publish_to_registry(
            registry_url=resolve_registry_url(registry_url=registry_url),
            bearer_token=bearer,
            payload=payload,
        )

        typer.echo(f"✓ published {result.drop_id}@{result.version}")
        typer.echo(f"  bundle: {result.bundle_url}")
        typer.echo(f"  sha256: {result.bundle_sha256}")
        sig = "verified" if result.signature_verified else "unsigned"
        if result.signer_passport:
            sig += f" ({result.signer_passport})"
        typer.echo(f"  signature: {sig}")
    except RegistryError as e:
        typer.echo(f"✗ {e}", err=True)
        if e.status == 401:
            raise typer.Exit(code=2) from e
        if e.status == 409:
            raise typer.Exit(code=3) from e
        raise typer.Exit(code=1) from e
    except typer.Exit:
        raise
    except Exception as e:
        typer.echo(f"✗ {e}", err=True)
        raise typer.Exit(code=1) from e
