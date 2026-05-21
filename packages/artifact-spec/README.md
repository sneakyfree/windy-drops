# @windy/drops-artifact-spec

TypeScript bindings (Zod runtime schemas + inferred types) for the **windy.drop.v1** manifest format.

Generated from [`schemas/windy.drop.v1.json`](../../schemas/windy.drop.v1.json) — the source of truth.

## Install

```bash
npm install @windy/drops-artifact-spec
```

## Usage

```ts
import { DropManifestSchema, type DropManifest, DROP_TYPES } from "@windy/drops-artifact-spec";

const manifest: DropManifest = DropManifestSchema.parse({
  schema: "windy.drop.v1",
  id: "kit-oc5-echo-hq",
  name: "Echo HQ",
  type: "control-panel-template",
  version: "1.0.0",
  author: [{ name: "Kit OC5", callsign: "Echo" }],
  license: "MIT",
});
```

## Exports

| Export | Kind | Purpose |
|---|---|---|
| `DropManifestSchema` | Zod schema | Runtime validation of any drop manifest |
| `DropManifest` | TypeScript type | Inferred from `DropManifestSchema` |
| `DROP_TYPES` | const tuple | 6 v1 reserved drop types |
| `DropType` | union | Inferred from `DROP_TYPES` |
| `PRICING_TYPES` | const tuple | 4 pricing types (free / tip-jar / paid / subscription) |
| `PricingType` | union | Inferred |
| `INTEGRITY_BANDS` | const tuple | Eternitas integrity bands |
| `IntegrityBand` | union | Inferred |
| `CLEARANCE_LEVELS` | const tuple | Eternitas clearance levels |
| `ClearanceLevel` | union | Inferred |

## Regenerating

This package's `src/index.ts` is GENERATED from `schemas/windy.drop.v1.json`. Don't hand-edit.

```bash
npm run codegen          # regenerate src/index.ts
npm run codegen:check    # regenerate then fail if git diff is non-empty
npm run build            # tsc compile
npm test                 # runtime parse + reject tests
npm run ci               # codegen:check + build + test
```

The CI workflow runs `codegen:check` to catch stale bindings.

## Strand reference

Owned by strand **WD-1** in [`docs/DNA_STRAND_MASTER_PLAN.md`](../../docs/DNA_STRAND_MASTER_PLAN.md). Paired with **WD-2** (Python Pydantic v2 bindings on PyPI as `windy_drops_spec`). Cross-binding byte-identity is enforced by **WD-11** conformance harness.

## License

MIT
