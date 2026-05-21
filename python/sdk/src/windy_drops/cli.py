"""cli.py — typer root for `windy-drops`. Subcommands live in commands/."""

from __future__ import annotations

import sys
from importlib.metadata import PackageNotFoundError, version

import typer

from .commands import bundle as bundle_cmd
from .commands import fork as fork_cmd
from .commands import new as new_cmd
from .commands import publish as publish_cmd
from .commands import sign as sign_cmd
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


# Implemented (WD-4, 5, 6, 7, 8, 10):
app.command("new")(new_cmd.run)
app.command("validate")(validate_cmd.run)
app.command("bundle")(bundle_cmd.run)
app.command("sign")(sign_cmd.run)
app.command("publish")(publish_cmd.run)
app.command("fork")(fork_cmd.run)


# Stubs for later strands (server-blocked on Phase C registry):


@app.command("withdraw")
def withdraw_stub(drop_id: str) -> None:
    """Hide a drop from search; existing installs keep working (WD-9)."""
    typer.echo("withdraw: not yet implemented (WD-9 — needs registry)", err=True)
    raise typer.Exit(code=2)


if __name__ == "__main__":
    sys.exit(app())
