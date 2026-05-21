"""tests/test_fork.py — WD-10 acceptance tests for `windy-drops fork`."""

from __future__ import annotations

import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEST_KEY = ROOT.parent.parent / "tools" / "conformance" / "test-keys" / "test-private.pem"


def run(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, "-m", "windy_drops.cli", *args],
        capture_output=True,
        text=True,
        cwd=ROOT,
    )


def test_fork_rewrites_id_forked_from_version_and_name_suffix() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / "source"
        dst = Path(tmp) / "forked"
        assert run("new", "--type", "skill", str(src)).returncode == 0
        r = run(
            "fork",
            "--from", str(src),
            "--author-name", "Tester",
            "my-fork-id",
            str(dst),
        )
        assert r.returncode == 0, r.stderr
        skill = (dst / "SKILL.md").read_text()
        assert re.search(r"^id: my-fork-id$", skill, flags=re.MULTILINE)
        assert re.search(r"^forked_from: your-handle-source$", skill, flags=re.MULTILINE)
        assert re.search(r"^version: 1\.0\.0$", skill, flags=re.MULTILINE)
        assert "(forked)" in skill
        assert "name: Tester" in skill

        v = run("validate", str(dst))
        assert v.returncode == 0, v.stderr


def test_fork_name_override() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / "source"
        dst = Path(tmp) / "forked"
        assert run("new", "--type", "skill", str(src)).returncode == 0
        r = run(
            "fork",
            "--from", str(src),
            "--name", "Custom Name",
            "--author-name", "Tester",
            "my-fork",
            str(dst),
        )
        assert r.returncode == 0, r.stderr
        assert "name: Custom Name" in (dst / "SKILL.md").read_text()


def test_fork_strips_existing_signature() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / "source"
        dst = Path(tmp) / "forked"
        assert run("new", "--type", "skill", str(src)).returncode == 0
        assert run(
            "sign", str(src),
            "--key", str(TEST_KEY),
            "--passport", "ET26-TEST-0001",
        ).returncode == 0
        assert run(
            "fork", "--from", str(src), "--author-name", "T", "my-fork", str(dst),
        ).returncode == 0
        skill = (dst / "SKILL.md").read_text()
        assert not re.search(r"^signature:", skill, flags=re.MULTILINE)


def test_fork_rejects_existing_nonempty_target() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / "source"
        dst = Path(tmp) / "forked"
        assert run("new", "--type", "skill", str(src)).returncode == 0
        assert run("new", "--type", "skill", str(dst)).returncode == 0
        r = run("fork", "--from", str(src), "--author-name", "T", "my-fork", str(dst))
        assert r.returncode == 1
        assert "not empty" in r.stderr


def test_fork_rejects_missing_source() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        r = run("fork", "--from", f"{tmp}/nope", "--author-name", "T", "my-fork", f"{tmp}/out")
        assert r.returncode == 1
        assert "not found" in r.stderr
