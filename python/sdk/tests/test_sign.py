"""tests/test_sign.py — WD-7 acceptance tests for `windy-drops sign`."""

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


def test_sign_writes_signature_block() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        drop = Path(tmp) / "sample"
        assert run("new", "--type", "skill", str(drop)).returncode == 0
        r = run(
            "sign",
            str(drop),
            "--key", str(TEST_KEY),
            "--passport", "ET26-TEST-0001",
            "--integrity-band", "fair",
            "--clearance-level", "verified",
        )
        assert r.returncode == 0, r.stderr
        skill = (drop / "SKILL.md").read_text()
        assert "signature:" in skill
        assert "algorithm: ES256" in skill
        assert "passport: ET26-TEST-0001" in skill
        assert re.search(r"signed_digest:\s*sha256:[a-f0-9]{64}", skill)
        assert re.search(r"signature:\s*[A-Za-z0-9+/=]{88}", skill)


def test_sign_is_idempotent() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        drop = Path(tmp) / "sample"
        assert run("new", "--type", "skill", str(drop)).returncode == 0
        assert run("sign", str(drop), "--key", str(TEST_KEY), "--passport", "ET26-TEST-0001").returncode == 0
        assert run("sign", str(drop), "--key", str(TEST_KEY), "--passport", "ET26-TEST-0002").returncode == 0
        skill = (drop / "SKILL.md").read_text()
        assert len(re.findall(r"^signature:", skill, flags=re.MULTILINE)) == 1
        assert "passport: ET26-TEST-0002" in skill


def test_sign_fails_when_key_missing() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        drop = Path(tmp) / "sample"
        assert run("new", "--type", "skill", str(drop)).returncode == 0
        r = run("sign", str(drop), "--key", "/nonexistent/key.pem", "--passport", "ET26-TEST-0001")
        assert r.returncode != 0


def test_cross_sdk_signed_digest_matches_via_canonical(tmp_path: Path) -> None:
    """When TS and Py SDKs sign the SAME input, the signed_digest matches.

    Signatures themselves differ (ES256 uses a random k) but the digest is
    deterministic over canonical_manifest + bundle_sha256 — both SDKs must
    derive the same one.
    """
    ts_cli = ROOT.parent.parent / "packages" / "sdk" / "bin" / "windy-drops"
    if not ts_cli.exists():
        import pytest
        pytest.skip("TS SDK not built; run `cd packages/sdk && npm install && npm run build`")

    # Sign a freshly-scaffolded drop with each SDK in independent directories.
    py_drop = tmp_path / "py" / "sample"
    py_drop.parent.mkdir()
    assert run("new", "--type", "skill", str(py_drop)).returncode == 0
    assert run("sign", str(py_drop), "--key", str(TEST_KEY), "--passport", "ET26-TEST-0001").returncode == 0
    py_digest = re.search(
        r"signed_digest:\s*(sha256:[a-f0-9]{64})", (py_drop / "SKILL.md").read_text()
    ).group(1)

    ts_drop = tmp_path / "ts" / "sample"
    ts_drop.parent.mkdir()
    subprocess.run(
        ["node", str(ts_cli), "new", "--type", "skill", str(ts_drop)],
        capture_output=True, text=True, check=True,
    )
    ts_result = subprocess.run(
        ["node", str(ts_cli), "sign", str(ts_drop),
         "--key", str(TEST_KEY),
         "--passport", "ET26-TEST-0001"],
        capture_output=True, text=True,
    )
    assert ts_result.returncode == 0, ts_result.stderr
    ts_digest = re.search(
        r"signed_digest:\s*(sha256:[a-f0-9]{64})", (ts_drop / "SKILL.md").read_text()
    ).group(1)

    assert py_digest == ts_digest, (
        f"cross-SDK signed_digest must match.\n  Py: {py_digest}\n  TS: {ts_digest}"
    )
