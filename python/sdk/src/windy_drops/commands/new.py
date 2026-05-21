"""new command — scaffold a new drop directory from a starter template."""

from __future__ import annotations

import sys

import typer

from ..lib.scaffold import scaffold


def run(
    path: str = typer.Argument(..., help="Directory to create (must not exist or must be empty)"),
    type: str = typer.Option(
        ...,
        "--type",
        "-t",
        help="Drop type (control-panel-template | skill | tool | theme | voice-pack | workflow)",
    ),
) -> None:
    """Scaffold a new drop directory from a starter template."""
    try:
        result = scaffold(type=type, path=path)
    except (ValueError, FileExistsError, FileNotFoundError) as e:
        typer.echo(f"✗ {e}", err=True)
        sys.exit(1)
    typer.echo(f"✓ scaffolded {type} drop at {result.target_dir}")
    typer.echo(f"  {len(result.files_copied)} files written\n")
    typer.echo("Next steps:")
    typer.echo(f"  1. Edit {result.target_dir}/SKILL.md (set author + id)")
    typer.echo(f"  2. windy-drops validate {result.target_dir}")
    typer.echo(f"  3. windy-drops publish {result.target_dir}")
