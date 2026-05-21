"""withdraw command — WD-9 (SDK side)."""

from __future__ import annotations

import os
import sys

import httpx
import typer

from ..lib.registry import resolve_registry_url


def run(
    drop_id: str = typer.Argument(..., help="Drop id to withdraw"),
    registry_url: str | None = typer.Option(None, "--registry-url"),
    token: str | None = typer.Option(None, "--token"),
    confirm: bool = typer.Option(False, "--confirm"),
) -> None:
    """Hide a drop from search; existing installs keep working."""
    if not confirm:
        typer.echo(
            f"Re-run with --confirm to withdraw '{drop_id}'. Bundles will stay on R2 "
            "so already-installed users keep working, but the drop will be hidden "
            "from browse + trending.",
            err=True,
        )
        raise typer.Exit(code=1)

    bearer = token or os.environ.get("WINDY_REGISTRY_TOKEN")
    if not bearer:
        typer.echo("✗ no Bearer token. Pass --token <jwt> or set $WINDY_REGISTRY_TOKEN", err=True)
        raise typer.Exit(code=2)

    url = f"{resolve_registry_url(registry_url=registry_url)}/api/v1/drops/{drop_id}"
    r = httpx.delete(url, headers={"authorization": f"Bearer {bearer}"}, timeout=30.0)
    if r.status_code == 204:
        typer.echo(f"✓ withdrew {drop_id}")
        typer.echo("  bundle remains on R2; installed users keep working.")
        return
    if r.status_code in (401, 403):
        typer.echo(f"✗ withdraw failed: {r.status_code}", err=True)
        raise typer.Exit(code=2)
    if r.status_code == 404:
        typer.echo("✗ drop_not_found", err=True)
        raise typer.Exit(code=4)
    typer.echo(f"✗ withdraw failed: {r.status_code} {r.text}", err=True)
    raise typer.Exit(code=1)
