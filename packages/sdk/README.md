# @windy/drops-sdk

TypeScript SDK + CLI for authoring and publishing **Windy Drops**.

```bash
npm install -g @windy/drops-sdk
windy-drops --help
```

## Commands

| Command | What it does | Strand |
|---|---|---|
| `new --type <type> <path>` | Scaffold a starter drop from `examples/<type>-minimal/` | WD-4 (this) |
| `validate <path>` | Validate SKILL.md frontmatter against the schema | WD-5 |
| `bundle <path>` | Produce a deterministic `.zip` + SHA-256 digest | WD-6 |
| `sign <path>` | Sign manifest with the author's Eternitas Passport (ES256) | WD-7 |
| `publish <path>` | Validate → bundle → sign → upload to R2 → POST to registry | WD-8 |
| `withdraw <drop-id>` | Hide from search (existing installs keep working) | WD-9 |
| `fork <source-drop-id> <new-id>` | Clone locally + rewrite manifest + register lineage | WD-10 |

Commands marked future-strand exit code 2 with a clear message until that strand lands.

## Scaffold

```bash
windy-drops new --type control-panel-template ./my-dashboard
# ✓ scaffolded control-panel-template drop at /.../my-dashboard
# Next steps:
#   1. Edit /.../my-dashboard/SKILL.md (set author + id)
#   2. windy-drops validate /.../my-dashboard
#   3. windy-drops publish /.../my-dashboard
```

The 6 v1 reserved drop types each ship a starter scaffold:

- `control-panel-template`
- `skill`
- `tool`
- `theme`
- `voice-pack`
- `workflow`

## Library API

```ts
import { scaffold } from "@windy/drops-sdk";

const result = await scaffold({ type: "skill", path: "./my-skill" });
console.log(result.targetDir, result.filesCopied);
```

## Parity with the Python SDK

The Python sibling on PyPI (`pip install windy-drops`) has the same CLI surface. A drop scaffolded by one is byte-identical to one scaffolded by the other; a drop published by one is indistinguishable to the registry. Cross-SDK byte-identity is enforced by the `WD-11` conformance harness.

## Strand reference

This package is owned by strands **WD-4..WD-10** in [`docs/DNA_STRAND_MASTER_PLAN.md`](../../docs/DNA_STRAND_MASTER_PLAN.md). Each strand owns one subcommand (or related set).

## License

MIT
