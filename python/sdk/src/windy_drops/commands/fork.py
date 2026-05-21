"""fork command — WD-10. Locally fork a drop: clone the bundle source, rewrite
SKILL.md (id, author, forked_from, version reset to 1.0.0).

In v1 we accept a LOCAL source via --from. Once the registry ships
(WD-12+), this command will also accept a registry drop-id and fetch
the bundle automatically (plus POST /drops/{id}/fork — WD-19).
"""

from __future__ import annotations

import re
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import typer
import yaml

from ..lib.eternitas import load_credential

FRONTMATTER_RE = re.compile(
    r"^---\r?\n(?P<yaml>[\s\S]*?)\r?\n---(?P<body>\r?\n[\s\S]*)?$"
)


@dataclass(frozen=True)
class ForkResult:
    source_dir: Path
    target_dir: Path
    new_id: str
    forked_from: str


def fork(
    *,
    from_: str,
    new_id: str,
    out: str,
    new_name: str | None = None,
    author_name: str | None = None,
    author_passport: str | None = None,
) -> ForkResult:
    source = Path(from_).resolve()
    if not source.exists():
        raise FileNotFoundError(f"source not found: {source}")

    target = Path(out).resolve()
    if target.exists():
        if any(target.iterdir()):
            raise FileExistsError(f"target directory not empty: {target}")
    else:
        target.mkdir(parents=True)

    for entry in source.iterdir():
        if entry.is_dir():
            shutil.copytree(entry, target / entry.name)
        else:
            shutil.copy2(entry, target / entry.name)

    skill_path = target / "SKILL.md"
    raw = skill_path.read_text(encoding="utf-8")
    match = FRONTMATTER_RE.match(raw)
    if not match:
        raise ValueError(f"source SKILL.md has no frontmatter: {skill_path}")

    manifest: dict[str, Any] = yaml.safe_load(match.group("yaml") or "") or {}
    if not isinstance(manifest, dict):
        raise ValueError(f"source SKILL.md frontmatter must be a YAML object: {skill_path}")

    source_id = str(manifest.get("id", ""))
    source_name = manifest.get("name")

    if author_name:
        author: dict[str, Any] = {"name": author_name}
        if author_passport:
            author["passport"] = author_passport
        new_author = [author]
    else:
        try:
            cred = load_credential()
            new_author = [
                {
                    "name": cred.passport or "Your Name",
                    **({"passport": cred.passport} if cred.passport else {}),
                }
            ]
        except (FileNotFoundError, ValueError):
            new_author = [{"name": "Your Name"}]

    manifest["id"] = new_id
    manifest["author"] = new_author
    manifest["forked_from"] = source_id
    manifest["version"] = "1.0.0"
    if new_name:
        manifest["name"] = new_name
    elif isinstance(source_name, str):
        manifest["name"] = f"{source_name} (forked)"
    manifest.pop("signature", None)

    yaml_out = yaml.safe_dump(
        manifest, sort_keys=False, default_flow_style=False, allow_unicode=True, width=10_000
    ).rstrip()
    body = match.group("body") or ""
    skill_path.write_text(f"---\n{yaml_out}\n---{body}", encoding="utf-8")

    return ForkResult(
        source_dir=source,
        target_dir=target,
        new_id=new_id,
        forked_from=source_id,
    )


def run(
    new_id: str = typer.Argument(..., help="ID for your fork"),
    target: str = typer.Argument(..., help="Directory to write the fork into (must be empty)"),
    from_: str = typer.Option(..., "--from", help="Local source drop directory"),
    name: str | None = typer.Option(None, "--name", help="Human-readable name"),
    author_name: str | None = typer.Option(None, "--author-name", help="Explicit author name"),
    author_passport: str | None = typer.Option(None, "--author-passport", help="Explicit author passport"),
) -> None:
    """Clone a drop locally and rewrite its manifest."""
    try:
        result = fork(
            from_=from_,
            new_id=new_id,
            out=target,
            new_name=name,
            author_name=author_name,
            author_passport=author_passport,
        )
    except (FileNotFoundError, FileExistsError, ValueError) as e:
        typer.echo(f"✗ {e}", err=True)
        sys.exit(1)
    typer.echo(f"✓ forked {result.forked_from} → {result.new_id}")
    typer.echo(f"  at {result.target_dir}\n")
    typer.echo("Next steps:")
    typer.echo(f"  1. Edit {result.target_dir}/SKILL.md (review fields)")
    typer.echo(f"  2. windy-drops validate {result.target_dir}")
    typer.echo(f"  3. windy-drops publish {result.target_dir}")
