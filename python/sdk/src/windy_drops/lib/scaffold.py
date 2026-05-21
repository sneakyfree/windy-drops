"""scaffold.py — copy a per-type starter directory from
examples/<type>-minimal/ into a user-specified path, rewriting the placeholder
`id` to match the target dir name.

The examples directory is the source of truth — updating an example
automatically updates what `windy-drops new` produces. Mirrors the TS SDK's
scaffold.ts so both languages produce byte-identical scaffolds.
"""

from __future__ import annotations

import os
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Final

RESERVED_DROP_TYPES: Final[tuple[str, ...]] = (
    "control-panel-template",
    "skill",
    "tool",
    "theme",
    "voice-pack",
    "workflow",
)


@dataclass(frozen=True)
class ScaffoldResult:
    examples_dir: Path
    target_dir: Path
    files_copied: list[str]


def _find_examples_root() -> Path:
    """Locate the repo's examples/ directory by walking up from this file.

    When installed via pip, the examples ship inside the package bundle (a
    sibling `examples/` directory). When running from source, the examples
    live a few levels up at <repo_root>/examples/.
    """
    here = Path(__file__).resolve().parent
    candidates = [
        here.parent.parent.parent.parent.parent / "examples",  # source tree
        here.parent.parent.parent.parent / "examples",          # python/ root
        here.parent.parent.parent / "examples",                 # src/ root
        here.parent / "examples",                               # bundled
    ]
    for c in candidates:
        if c.exists() and c.is_dir():
            return c
    raise FileNotFoundError(
        f"Could not locate examples/ directory. Searched: "
        + ", ".join(str(c) for c in candidates)
    )


def scaffold(*, type: str, path: str | os.PathLike[str]) -> ScaffoldResult:
    """Scaffold a starter drop of the given type at the given path."""
    if type not in RESERVED_DROP_TYPES:
        raise ValueError(
            f"Unknown drop type: {type}. Must be one of: "
            + ", ".join(RESERVED_DROP_TYPES)
        )

    examples_root = _find_examples_root()
    examples_dir = examples_root / f"{type}-minimal"
    if not examples_dir.exists():
        raise FileNotFoundError(
            f"No starter scaffold for type {type} at {examples_dir}"
        )

    target_dir = Path(path).resolve()
    if target_dir.exists():
        if any(target_dir.iterdir()):
            raise FileExistsError(f"Target directory not empty: {target_dir}")
    else:
        target_dir.mkdir(parents=True)

    # Recursively copy.
    for entry in examples_dir.iterdir():
        if entry.is_dir():
            shutil.copytree(entry, target_dir / entry.name)
        else:
            shutil.copy2(entry, target_dir / entry.name)

    # Rewrite the placeholder `id` to a target-dir-named id.
    skill_path = target_dir / "SKILL.md"
    if skill_path.exists():
        body = skill_path.read_text(encoding="utf-8")
        slug = target_dir.name or "my-drop"
        rewritten = re.sub(
            r"^id: your-handle-(.+)$",
            f"id: your-handle-{slug}",
            body,
            flags=re.MULTILINE,
        )
        skill_path.write_text(rewritten, encoding="utf-8")

    files_copied = sorted(
        str(p.relative_to(target_dir))
        for p in target_dir.rglob("*")
        if p.is_file()
    )

    return ScaffoldResult(
        examples_dir=examples_dir,
        target_dir=target_dir,
        files_copied=files_copied,
    )
