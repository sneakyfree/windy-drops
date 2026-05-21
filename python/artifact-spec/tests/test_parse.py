"""tests/test_parse.py — WD-2 acceptance tests.

Runs the generated Pydantic v2 models against the conformance fixtures and
asserts:
  - echo-hq.json parses cleanly
  - invalid-no-author.json fails with an error path including `author`
  - single-object author (not array) is rejected
  - empty author array is rejected
  - DROP_TYPES enum has all 6 v1 reserved types

Mirrors packages/artifact-spec/tests/parse.test.mjs (TypeScript side) so the
two SDKs prove byte-identity at the fixture layer.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from windy_drops_spec import DROP_TYPES, DropManifest

ROOT = Path(__file__).resolve().parent.parent.parent.parent
FIXTURES = ROOT / "tools" / "conformance" / "fixtures"


def load_fixture(name: str) -> dict:
    return json.loads((FIXTURES / name).read_text())


def test_echo_hq_parses_cleanly() -> None:
    manifest = DropManifest.model_validate(load_fixture("echo-hq.json"))
    assert manifest.id == "kit-oc5-echo-hq"
    assert manifest.type == "control-panel-template"


def test_invalid_no_author_fails_with_author_path() -> None:
    with pytest.raises(ValidationError) as exc_info:
        DropManifest.model_validate(load_fixture("invalid-no-author.json"))
    error_str = str(exc_info.value).lower()
    assert "author" in error_str


def test_drop_types_enum_has_all_six_v1_types() -> None:
    assert set(DROP_TYPES) == {
        "control-panel-template",
        "skill",
        "tool",
        "theme",
        "voice-pack",
        "workflow",
    }


def test_single_object_author_not_array_rejected() -> None:
    m = load_fixture("echo-hq.json")
    m["author"] = m["author"][0]
    with pytest.raises(ValidationError):
        DropManifest.model_validate(m)


def test_empty_author_array_rejected() -> None:
    m = load_fixture("echo-hq.json")
    m["author"] = []
    with pytest.raises(ValidationError):
        DropManifest.model_validate(m)


def test_paid_pricing_with_amount_and_currency_succeeds() -> None:
    m = load_fixture("echo-hq.json")
    m["pricing"] = {"type": "paid", "amount_cents": 500, "currency": "USD"}
    # Schema accepts; signature requirement is enforced by registry (WD-18), not schema.
    DropManifest.model_validate(m)


# NOTE: paid pricing without amount_cents/currency is NOT rejected at the schema
# level — datamodel-code-generator doesn't translate JSON Schema if/then
# conditionals to Pydantic. The constraint is enforced server-side at WD-18
# (registry publish endpoint). The TypeScript binding (WD-1) has the same gap;
# both bindings are intentionally aligned in what they verify.


def test_pricing_type_discriminator_rejects_unknown_type() -> None:
    """WD-2 acceptance criterion #5: Pydantic discriminator on pricing.type works."""
    m = load_fixture("echo-hq.json")
    m["pricing"] = {"type": "barter", "amount_cents": None, "currency": None}
    with pytest.raises(ValidationError):
        DropManifest.model_validate(m)
