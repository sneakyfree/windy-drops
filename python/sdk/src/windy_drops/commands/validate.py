"""validate command — WD-5. Parse SKILL.md frontmatter and validate against
the windy.drop.v1 schema (via windy_drops_spec Pydantic models)."""

from __future__ import annotations

import sys
from dataclasses import dataclass

import typer
from pydantic import ValidationError
from windy_drops_spec import DropManifest

from ..lib.skill_md import SkillMdError, read_skill_md


@dataclass(frozen=True)
class ValidateError:
    path: str
    message: str
    file_path: str


@dataclass(frozen=True)
class ValidateResult:
    valid: bool
    errors: list[ValidateError]


def validate(*, path: str) -> ValidateResult:
    try:
        parsed = read_skill_md(path)
    except SkillMdError as e:
        return ValidateResult(
            valid=False,
            errors=[ValidateError(path="", message=str(e), file_path=e.file_path)],
        )

    try:
        DropManifest.model_validate(parsed.frontmatter)
    except ValidationError as e:
        errors = [
            ValidateError(
                path=".".join(str(p) for p in issue["loc"]) or "(root)",
                message=issue["msg"],
                file_path=str(parsed.file_path),
            )
            for issue in e.errors()
        ]
        return ValidateResult(valid=False, errors=errors)

    return ValidateResult(valid=True, errors=[])


def run(
    path: str = typer.Argument(..., help="Drop directory"),
) -> None:
    """Validate a drop's SKILL.md frontmatter against the schema."""
    result = validate(path=path)
    if result.valid:
        typer.echo(f"✓ {path}/SKILL.md is valid")
        raise typer.Exit(code=0)

    for err in result.errors:
        typer.echo(f"✗ {err.file_path}: {err.path}: {err.message}", err=True)
    raise typer.Exit(code=1)
