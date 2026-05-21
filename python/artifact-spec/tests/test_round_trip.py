"""tests/test_round_trip.py — WD-3 acceptance: every valid fixture round-trips
through the Python binding (parse -> dump -> parse -> equal).

Invalid fixtures are exercised in test_parse.py and the schema-level runner
(tools/conformance/run.sh).
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from windy_drops_spec import DropManifest

ROOT = Path(__file__).resolve().parent.parent.parent.parent
FIXTURES = ROOT / "tools" / "conformance" / "fixtures"

# Fixtures the SCHEMA correctly rejects but the codegen bindings can't catch
# because datamodel-code-generator (and json-schema-to-zod on the TS side)
# don't translate JSON Schema conditional logic (if/then, allOf > if/then).
# Both binding sides have identical gaps; the SDK's `validate` command
# (WD-5) uses raw JSON Schema validation to plug this gap before publish.
SCHEMA_ONLY_INVALID = {
    "invalid-agent-no-operator.json",
}

valid_fixtures = sorted(
    f.name for f in FIXTURES.glob("*.json") if not f.name.startswith("invalid-")
)
invalid_fixtures = sorted(
    f.name for f in FIXTURES.glob("invalid-*.json")
)


@pytest.mark.parametrize("name", valid_fixtures)
def test_round_trip(name: str) -> None:
    raw = json.loads((FIXTURES / name).read_text())
    first = DropManifest.model_validate(raw)
    serialized = first.model_dump(mode="json", by_alias=True, exclude_none=False)
    second = DropManifest.model_validate(serialized)
    assert first == second


@pytest.mark.parametrize("name", invalid_fixtures)
def test_invalid_rejected(name: str) -> None:
    if name in SCHEMA_ONLY_INVALID:
        pytest.skip("schema-only invalid; bindings can't enforce JSON Schema if/then")
    raw = json.loads((FIXTURES / name).read_text())
    with pytest.raises(ValidationError):
        DropManifest.model_validate(raw)
