# windy-drops-spec

Python bindings (Pydantic v2 models + Literal types) for the **windy.drop.v1** manifest format.

Generated from [`schemas/windy.drop.v1.json`](../../schemas/windy.drop.v1.json) — the source of truth.

## Install

```bash
pip install windy-drops-spec
# or
uv add windy-drops-spec
```

## Usage

```python
from windy_drops_spec import DropManifest, DROP_TYPES

manifest = DropManifest.model_validate({
    "schema": "windy.drop.v1",
    "id": "kit-oc5-echo-hq",
    "name": "Echo HQ",
    "type": "control-panel-template",
    "version": "1.0.0",
    "author": [{"name": "Kit OC5", "callsign": "Echo"}],
    "license": "MIT",
})

assert manifest.id == "kit-oc5-echo-hq"
assert manifest.type in DROP_TYPES
```

## Exports

| Export | Kind | Purpose |
|---|---|---|
| `DropManifest` | Pydantic v2 BaseModel | Runtime validation of any drop manifest |
| `DROP_TYPES` | tuple | 6 v1 reserved drop types |
| `DropType` | Literal | Static type for drop types |
| `PRICING_TYPES` | tuple | 4 pricing types (free / tip-jar / paid / subscription) |
| `PricingType` | Literal | Static type |
| `INTEGRITY_BANDS` | tuple | Eternitas integrity bands |
| `IntegrityBand` | Literal | Static type |
| `CLEARANCE_LEVELS` | tuple | Eternitas clearance levels |
| `ClearanceLevel` | Literal | Static type |

## Regenerating

The `src/windy_drops_spec/_generated.py` file is GENERATED from `schemas/windy.drop.v1.json`. Don't hand-edit.

```bash
# Regenerate (uses datamodel-code-generator)
uvx --with datamodel-code-generator python codegen.py

# Build wheel + sdist
uv build

# Run tests
uv pip install -e .[test] && pytest
```

CI re-runs `codegen.py` on every PR and fails if the generated file is stale:

```bash
uvx --with datamodel-code-generator python codegen.py
git diff --exit-code -- src/windy_drops_spec/_generated.py
```

## Known limitations (intentional, aligned with @windy/drops-artifact-spec)

Both bindings enforce the schema's universal fields, drop-type enum, i18n
shape, signature structure, and per-field constraints (length, pattern, enum,
min/max). They do NOT enforce JSON Schema if/then dependent constraints
(notably "paid pricing requires amount_cents + currency"). That class of
validation is enforced server-side at the registry layer (WD-18) per
ADR-053. Both bindings are intentionally aligned in what they verify so a
manifest accepted by one is accepted by the other (per WD-11 conformance).

## Strand reference

Owned by strand **WD-2** in [`docs/DNA_STRAND_MASTER_PLAN.md`](../../docs/DNA_STRAND_MASTER_PLAN.md). Paired with **WD-1** (TypeScript Zod bindings on npm as `@windy/drops-artifact-spec`). Cross-binding byte-identity is enforced by **WD-11** conformance harness.

## License

MIT
