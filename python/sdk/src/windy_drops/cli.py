"""cli.py — typer root for `windy-drops`. Subcommands live in commands/."""

from __future__ import annotations

import sys
from importlib.metadata import PackageNotFoundError, version

import typer

from .commands import bundle as bundle_cmd
from .commands import new as new_cmd
from .commands import validate as validate_cmd

app = typer.Typer(
    name="windy-drops",
    help="CLI for publishing Windy Drops.",
    no_args_is_help=True,
    add_completion=False,
)


def _version_callback(value: bool) -> None:
    if not value:
        return
    try:
        v = version("windy-drops")
    except PackageNotFoundError:
        v = "0.0.0+local"
    typer.echo(v)
    raise typer.Exit()


@app.callback()
def root(
    version_: bool = typer.Option(
        False,
        "--version",
        "-V",
        is_eager=True,
        callback=_version_callback,
        help="Print version and exit.",
    ),
) -> None:
    """Windy Drops CLI."""


# new (WD-4), validate (WD-5), bundle (WD-6) are fully implemented.
app.command("new")(new_cmd.run)
app.command("validate")(validate_cmd.run)
app.command("bundle")(bundle_cmd.run)


# Stubs for later strands. They exit non-zero with a clear message until
# their owning strand lands.


@app.command("sign")
def sign_stub(path: str) -> None:
    """Sign the manifest with the author's Eternitas Passport (WD-7)."""
    typer.echo("sign: not yet implemented (WD-7)", err=True)
    raise typer.Exit(code=2)


@app.command("publish")
def publish_stub(path: str) -> None:
    """Validate, bundle, sign, upload to R2, POST to registry (WD-8)."""
    typer.echo("publish: not yet implemented (WD-8)", err=True)
    raise typer.Exit(code=2)


@app.command("withdraw")
def withdraw_stub(drop_id: str) -> None:
    """Hide a drop from search; existing installs keep working (WD-9)."""
    typer.echo("withdraw: not yet implemented (WD-9)", err=True)
    raise typer.Exit(code=2)


@app.command("fork")
def fork_stub(source_drop_id: str, new_id: str) -> None:
    """Clone a published drop locally, rewriting the manifest (WD-10)."""
    typer.echo("fork: not yet implemented (WD-10)", err=True)
    raise typer.Exit(code=2)


if __name__ == "__main__":
    sys.exit(app())
