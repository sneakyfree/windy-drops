"""skill_md.py — parse a SKILL.md file into YAML frontmatter dict + body.

Mirrors packages/sdk/src/lib/skill-md.ts (TS sibling). Both parsers MUST
extract the same frontmatter object for the same input file.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml

FRONTMATTER_RE = re.compile(
    r"^---\r?\n(?P<yaml>[\s\S]*?)\r?\n---\r?\n?(?P<body>[\s\S]*)$"
)


class SkillMdError(Exception):
    """Raised when SKILL.md is missing or malformed."""

    def __init__(self, message: str, file_path: Path | str) -> None:
        super().__init__(f"{file_path}: {message}")
        self.file_path = str(file_path)


@dataclass(frozen=True)
class ParsedSkillMd:
    file_path: Path
    frontmatter: dict[str, Any]
    body: str
    frontmatter_start_line: int
    body_start_line: int


def read_skill_md(drop_dir: str | Path) -> ParsedSkillMd:
    file_path = Path(drop_dir).resolve() / "SKILL.md"
    try:
        raw = file_path.read_text(encoding="utf-8")
    except FileNotFoundError as e:
        raise SkillMdError(f"SKILL.md not found ({e})", file_path) from e

    match = FRONTMATTER_RE.match(raw)
    if not match:
        raise SkillMdError(
            "no YAML frontmatter (must begin with `---` and contain a closing `---`)",
            file_path,
        )

    try:
        frontmatter = yaml.safe_load(match.group("yaml") or "")
    except yaml.YAMLError as e:
        raise SkillMdError(f"YAML parse error: {e}", file_path) from e

    if not isinstance(frontmatter, dict):
        raise SkillMdError("frontmatter must be a YAML object", file_path)

    yaml_line_count = (match.group("yaml") or "").count("\n") + 1
    body_start_line = 2 + yaml_line_count

    return ParsedSkillMd(
        file_path=file_path,
        frontmatter=frontmatter,
        body=match.group("body") or "",
        frontmatter_start_line=1,
        body_start_line=body_start_line,
    )
