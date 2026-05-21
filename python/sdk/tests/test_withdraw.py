"""test_withdraw.py — WD-9 acceptance tests for `windy-drops withdraw`."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def run(*args: str, env_extra: dict[str, str] | None = None) -> subprocess.CompletedProcess[str]:
    env = dict(os.environ)
    env.pop("WINDY_REGISTRY_TOKEN", None)
    if env_extra:
        env.update(env_extra)
    return subprocess.run(
        [sys.executable, "-m", "windy_drops.cli", *args],
        capture_output=True, text=True, cwd=ROOT, env=env,
    )


def test_withdraw_without_confirm_prints_notice() -> None:
    r = run("withdraw", "some-drop", env_extra={"WINDY_REGISTRY_TOKEN": "x"})
    assert r.returncode == 1
    assert "--confirm" in r.stderr


def test_withdraw_confirm_without_token_exits_2() -> None:
    r = run(
        "withdraw", "some-drop", "--confirm", "--registry-url", "http://nowhere",
    )
    assert r.returncode == 2
    assert "Bearer" in r.stderr
