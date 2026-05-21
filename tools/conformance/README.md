# tools/conformance/

Conformance test harness for the Windy Drops substrate.

## What lives here

| Path | Owned by | Purpose |
|---|---|---|
| `fixtures/` | WD-3 | Golden manifests + expected bundle outputs |
| `run.sh` | WD-0 (schema), WD-3 (binding round-trip), WD-11 (byte-identity) | Test runner |
| `test-keys/` | WD-3, WD-7 | Test Eternitas private/public key pair (NOT a real Eternitas key) for sign tests |

## Fixture naming convention

| Filename pattern | Expected outcome | Used by |
|---|---|---|
| `<name>.json` | Schema accepts; both bindings parse without error; round-trips byte-identically | WD-0, WD-1, WD-2, WD-3, WD-11 |
| `invalid-<name>.json` | Schema REJECTS; both bindings raise ValidationError | WD-0, WD-1, WD-2, WD-3 |

A fixture **not** prefixed `invalid-` MUST validate against `schemas/windy.drop.v1.json`. A fixture prefixed `invalid-` MUST be rejected by the schema AND by both bindings.

## Adding a new fixture

1. Drop a `.json` (or `invalid-*.json`) into `fixtures/`. Name should be short + descriptive.
2. Run `tools/conformance/run.sh` from the repo root — your fixture is auto-discovered.
3. If it's a valid fixture and exercises a new field shape, add a targeted assertion to:
   - TS: `packages/artifact-spec/tests/parse.test.mjs`
   - Py: `python/artifact-spec/tests/test_parse.py`
4. If it represents a new author-flow / sign-flow / publish-flow case, add an SDK test under `packages/sdk/tests/` (WD-4+) and `python/sdk/tests/` (WD-4+).

## Fixtures shipped (current)

### Valid

| Fixture | What it exercises |
|---|---|
| `echo-hq.json` | Fully populated: signed control-panel-template, agent author with operator, tip-jar opt-in, all optional fields, control-panel extension |
| `echo-hq-neon.json` | A FORK of echo-hq — `forked_from` set, human author, different license decisions preserved |
| `minimal-skill.json` | Minimum-viable manifest — only the 7 required fields + one author |
| `tip-enabled.json` | `pricing.type=tip-jar`, Stripe Connect account populated, no signature (free monetization), human author |
| `i18n-multilang.json` | i18n object form for both `name` AND `subtitle`; 5 locales in name |

### Invalid (must be rejected)

| Fixture | What it catches |
|---|---|
| `invalid-no-author.json` | Missing required `author` field |
| `invalid-unknown-type.json` | `type` outside the 6 v1 enum |
| `invalid-bad-id.json` | `id` violates kebab-case pattern (uppercase) |
| `invalid-bad-semver.json` | `version` is not SemVer 2.0.0 |
| `invalid-agent-no-operator.json` | Author with `type: "agent"` missing required `operator` field |

## Running the harness

```bash
# Schema-level conformance (ajv-cli + jsonschema Python)
tools/conformance/run.sh

# TypeScript binding round-trip
cd packages/artifact-spec && npm run ci

# Python binding round-trip
cd python/artifact-spec && uv run pytest

# WD-11 byte-identity (cross-SDK; lands with M3a+M3b)
# tools/conformance/run-bundle-identity.sh
```

## Strand reference

Owned by **WD-3** in [`../../docs/DNA_STRAND_MASTER_PLAN.md`](../../docs/DNA_STRAND_MASTER_PLAN.md). Extended by **WD-11** (cross-SDK byte-identity).
