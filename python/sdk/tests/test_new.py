"""tests/test_new.py — WD-4 acceptance tests for the Python `windy-drops new` command."""

from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent


def run(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, "-m", "windy_drops.cli", *args],
        capture_output=True,
        text=True,
        cwd=ROOT,
    )


def test_version_flag_prints_version() -> None:
    result = run("--version")
    assert result.returncode == 0
    assert result.stdout.strip()  # some version string


def test_new_control_panel_template_scaffolds_valid_skill_md() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        target = Path(tmp) / "my-dashboard"
        result = run("new", "--type", "control-panel-template", str(target))
        assert result.returncode == 0, result.stderr
        skill = (target / "SKILL.md").read_text()
        assert "type: control-panel-template" in skill
        assert "id: your-handle-my-dashboard" in skill
        assert (target / "render.js").exists()
        assert (target / "styles.css").exists()


def test_new_skill_scaffolds_minimal() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        target = Path(tmp) / "my-skill"
        result = run("new", "--type", "skill", str(target))
        assert result.returncode == 0, result.stderr
        assert "type: skill" in (target / "SKILL.md").read_text()


def test_new_bogus_type_rejected() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        result = run("new", "--type", "not-a-real-type", str(Path(tmp) / "x"))
        assert result.returncode == 1
        assert "unknown drop type" in result.stderr.lower()


def test_new_on_nonempty_directory_rejected() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        target = Path(tmp) / "existing"
        target.mkdir()
        (target / "preexisting.txt").write_text("hello")
        result = run("new", "--type", "skill", str(target))
        assert result.returncode == 1
        assert "not empty" in result.stderr.lower()


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
def test_all_six_v1_reserved_types_have_scaffolds(drop_type: str) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        target = Path(tmp) / "x"
        result = run("new", "--type", drop_type, str(target))
        assert result.returncode == 0, result.stderr
        skill = (target / "SKILL.md").read_text()
        assert f"type: {drop_type}" in skill
