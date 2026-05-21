"""tests/test_bundle.py — WD-6 acceptance tests for `windy-drops bundle`."""

from __future__ import annotations

import hashlib
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def run(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, "-m", "windy_drops.cli", *args],
        capture_output=True,
        text=True,
        cwd=ROOT,
    )


def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def test_bundle_produces_valid_zip_with_sidecar() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        drop = Path(tmp) / "dashboard"
        assert run("new", "--type", "control-panel-template", str(drop)).returncode == 0
        r = run("bundle", str(drop), "--out", f"{tmp}/out")
        assert r.returncode == 0, r.stderr
        zip_path = Path(tmp) / "out.zip"
        sha_path = Path(tmp) / "out.sha256"
        assert zip_path.exists()
        assert sha_path.exists()
        assert sha_path.read_text().strip() == sha256(zip_path.read_bytes())
        # ZIP magic
        assert zip_path.read_bytes()[:4] == b"PK\x03\x04"


def test_bundle_is_deterministic() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        drop = Path(tmp) / "dashboard"
        assert run("new", "--type", "control-panel-template", str(drop)).returncode == 0
        assert run("bundle", str(drop), "--out", f"{tmp}/a").returncode == 0
        assert run("bundle", str(drop), "--out", f"{tmp}/b").returncode == 0
        assert (Path(tmp) / "a.zip").read_bytes() == (Path(tmp) / "b.zip").read_bytes()


def test_bundle_fails_before_writing_zip_on_invalid_manifest() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        drop = Path(tmp) / "broken"
        drop.mkdir()
        (drop / "SKILL.md").write_text("""---
schema: windy.drop.v1
id: broken-no-author
name: Broken
type: skill
version: 1.0.0
license: MIT
---
""")
        r = run("bundle", str(drop), "--out", f"{tmp}/out")
        assert r.returncode == 1
        assert "validation failed" in r.stderr
        assert not (Path(tmp) / "out.zip").exists()


def test_bundle_excludes_ignored_entries() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        drop = Path(tmp) / "skill"
        assert run("new", "--type", "skill", str(drop)).returncode == 0
        (drop / ".git").mkdir()
        (drop / ".git" / "HEAD").write_text("ref: refs/heads/main\n")
        (drop / "node_modules").mkdir()
        (drop / "node_modules" / "foo.js").write_text("// noise\n")
        (drop / ".DS_Store").write_text("ds noise")

        assert run("bundle", str(drop), "--out", f"{tmp}/out").returncode == 0
        body = (Path(tmp) / "out.zip").read_bytes().decode("latin-1")
        assert ".git/HEAD" not in body
        assert "node_modules/foo.js" not in body
        assert ".DS_Store" not in body
        assert "SKILL.md" in body
