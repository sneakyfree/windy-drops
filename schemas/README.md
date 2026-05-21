# schemas/

Source-of-truth JSON Schemas for the Windy Drops manifest format.

## Files

| File | Purpose |
|---|---|
| `windy.drop.v1.json` | The canonical `windy.drop.v1` manifest schema. Both language bindings codegen from this file. |

## Validating a manifest

```bash
# JavaScript / Node (ajv-cli + ajv-formats)
npx --yes -p ajv-cli@5 -p ajv-formats@3 ajv validate \
  -s schemas/windy.drop.v1.json \
  -d path/to/SKILL-frontmatter.json \
  --spec=draft2020 -c ajv-formats

# Python (jsonschema, Draft 2020-12)
python3 -c "import json, jsonschema; \
  jsonschema.Draft202012Validator(json.load(open('schemas/windy.drop.v1.json'))) \
  .validate(json.load(open('path/to/SKILL-frontmatter.json')))"
```

## Versioning

- **v1.x is additive only.** New optional fields and new drop types can land in `windy.drop.v1.json` without bumping the major version. Consumers MUST ignore unknown fields.
- **A v2 schema is a breaking change.** New `$id` (`windy.drop.v2.json`), new manifest `schema:` value. Old consumers reject v2 manifests cleanly via the `schema:` const check.
- **Deprecation window:** any v1→v2 transition supports both for at least 12 months.

## How bindings codegen

| Binding | Tool | Input | Output |
|---|---|---|---|
| TypeScript (Zod + types) | `json-schema-to-zod` | `schemas/windy.drop.v1.json` | `packages/artifact-spec/src/index.ts` |
| Python (Pydantic v2) | `datamodel-code-generator` | `schemas/windy.drop.v1.json` | `python/artifact-spec/src/windy_drops_spec/__init__.py` |

CI re-runs codegen on every PR and fails if the binding files are stale relative to the schema. See `.github/workflows/ci.yml`.

## Strand reference

This directory is owned by strand **WD-0** in `docs/DNA_STRAND_MASTER_PLAN.md`. Changes to `windy.drop.v1.json` are additive-only (per the versioning policy above). Adding a new drop type, a new optional field, or a new type-specific extension section is in-scope. Anything that breaks an existing v1 manifest is a v2 change and requires a new ADR.
