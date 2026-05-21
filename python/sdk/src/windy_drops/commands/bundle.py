"""bundle command — WD-6. Validate the drop, walk its directory, emit a
deterministic ZIP + .sha256 sidecar."""

from __future__ import annotations

import sys
from dataclasses import dataclass
from pathlib import Path

import typer

from ..lib.skill_md import read_skill_md
from ..lib.zip_writer import DEFAULT_IGNORE, collect_entries, pack_zip, sha256_hex
from .validate import validate


@dataclass(frozen=True)
class BundleResult:
    zip_path: Path
    sha256: str
    size: int
    entry_count: int


def bundle(*, path: str, out: str | None = None) -> BundleResult:
    v = validate(path=path)
    if not v.valid:
        details = "\n".join(
            f"  {e.file_path}: {e.path}: {e.message}" for e in v.errors
        )
        raise ValueError(f"validation failed:\n{details}")

    parsed = read_skill_md(path)
    drop_id = parsed.frontmatter.get("id")
    version = parsed.frontmatter.get("version")
    if not drop_id or not version:
        raise ValueError("manifest missing id or version (should have been caught by validate)")

    drop_dir = Path(path).resolve()
    entries = collect_entries(drop_dir, DEFAULT_IGNORE)
    zip_bytes = pack_zip(entries)
    sha = sha256_hex(zip_bytes)

    out_base = Path(out).resolve() if out else (drop_dir.parent / f"{drop_id}-{version}")
    zip_path = out_base.with_suffix(".zip")
    sha_path = out_base.with_suffix(".sha256")

    zip_path.write_bytes(zip_bytes)
    sha_path.write_text(f"{sha}\n")

    return BundleResult(
        zip_path=zip_path,
        sha256=sha,
        size=len(zip_bytes),
        entry_count=len(entries),
    )


def run(
    path: str = typer.Argument(..., help="Drop directory"),
    out: str | None = typer.Option(
        None,
        "--out",
        "-o",
        help="Output path prefix (default: <parent>/<id>-<version>)",
    ),
) -> None:
    """Produce a deterministic .zip + SHA-256 digest."""
    try:
        result = bundle(path=path, out=out)
    except ValueError as e:
        typer.echo(f"✗ {e}", err=True)
        raise typer.Exit(code=1)
    typer.echo(f"✓ bundled {result.entry_count} files")
    typer.echo(f"  {result.zip_path} ({result.size} bytes)")
    typer.echo(f"  sha256: {result.sha256}")
