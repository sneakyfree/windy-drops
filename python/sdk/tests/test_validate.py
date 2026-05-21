"""tests/test_validate.py — WD-5 acceptance tests for `windy-drops validate`."""

from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
REPO = ROOT.parent.parent


def run(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, "-m", "windy_drops.cli", *args],
        capture_output=True,
        text=True,
        cwd=ROOT,
    )


def write_skill(content: str) -> Path:
    tmp = Path(tempfile.mkdtemp(prefix="wd-validate-"))
    (tmp / "SKILL.md").write_text(content)
    return tmp


@pytest.mark.parametrize(
    "drop_type",
    [
        "control-panel-template",
        "skill",
        "tool",
        "theme",
        "voice-pack",
        "workflow",
    ],
)
def test_validate_accepts_every_scaffolded_example(drop_type: str) -> None:
    r = run("validate", str(REPO / "examples" / f"{drop_type}-minimal"))
    assert r.returncode == 0, f"{drop_type} should be valid:\n{r.stderr}"
    assert "valid" in r.stdout


def test_validate_rejects_manifest_missing_required_author() -> None:
    dir_ = write_skill("""---
schema: windy.drop.v1
id: broken-no-author
name: Broken
type: skill
version: 1.0.0
license: MIT
---
""")
    r = run("validate", str(dir_))
    assert r.returncode == 1
    assert "author" in r.stderr.lower()


def test_validate_rejects_when_skill_md_missing() -> None:
    dir_ = Path(tempfile.mkdtemp(prefix="wd-validate-"))
    r = run("validate", str(dir_))
    assert r.returncode == 1
    assert "SKILL.md" in r.stderr


def test_validate_rejects_when_frontmatter_missing() -> None:
    dir_ = write_skill("# Just a body, no frontmatter\n")
    r = run("validate", str(dir_))
    assert r.returncode == 1
    assert "frontmatter" in r.stderr.lower()


def test_validate_rejects_bad_semver() -> None:
    dir_ = write_skill("""---
schema: windy.drop.v1
id: bad-semver
name: Bad
type: skill
version: not-semver
author:
  - name: Tester
license: MIT
---
""")
    r = run("validate", str(dir_))
    assert r.returncode == 1
    assert "version" in r.stderr
