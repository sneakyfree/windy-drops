# Windy Drops

**The open marketplace for the Windy ecosystem.** Dashboards, skills, tools, themes, workflows — browse, tap *Integrate*, use anywhere.

> "Hatch your agent → scroll Windy Chat → see a sick dashboard a kid in Seoul just dropped → tap Integrate → it's yours, in your Control Panel, forever."

---

## What this is

Windy Drops is the platform layer that turns the Windy ecosystem into a content marketplace. Anyone in the world can publish a **drop** — a dashboard template, an agent skill, a tool, a theme, a workflow — and anyone else can install it with one tap from anywhere in the ecosystem (Windy Chat feed, in-app picker, web browse, CLI).

Drops are not apps. They're not skills only. They're not dashboards only. They're a **universal installable artifact** — one format that every surface in the Windy ecosystem knows how to consume.

This repo holds:

- **`schemas/`** — canonical JSON Schema for `windy.drop.v1`. Source of truth; both language SDKs codegen from here.
- **`packages/artifact-spec/`** — TypeScript bindings (`@windy/drops-artifact-spec` on npm) generated from `schemas/`.
- **`packages/sdk/`** — TypeScript SDK (`@windy/drops-sdk` on npm) — `npm install` to publish drops.
- **`python/artifact-spec/`** — Python bindings (`windy_drops_spec` on PyPI; Pydantic v2 from same JSON Schema).
- **`python/sdk/`** — Python SDK (`windy-drops` on PyPI) — `pip install` to publish drops.
- **`docs/`** — the substrate ADRs, authoring guide, versioning policy.
- **`examples/`** — copy-paste scaffolds for new drop authors (one per drop type).
- **`tools/`** — bundle conformance tests + R2 upload helpers + cross-SDK byte-identity verification.

**Polyglot by design.** Both Python and TypeScript SDKs are first-class — neither is the "canonical" implementation. A drop published from `pip install windy-drops` is byte-identical to one published from `npm install -g @windy/drops-sdk`. See ADR-053 §"Language bindings policy."

The registry service (search, trending, install API, user libraries) lives separately in `sneakyfree/windy-registry` (FastAPI + Postgres + R2). Per-surface host code (Control Panel, Fly skill picker, etc.) lives in each surface's own repo.

## How a drop reaches a user

```
 author writes a drop                    runtime installs it
 ─────────────────────                   ────────────────────
   manifest + bundle                       user taps "Integrate"
            │                                       │
            ▼                                       ▼
       windy publish                       account adds drop to library
            │                                       │
   bundle → R2  +  manifest → registry              │
                              │                     ▼
                              ▼            next time the relevant
                  Windy Chat sees a new drop  surface opens, drop
                  → ranks in trending feed    is there in dropdown
```

## Drop types (v1)

| Type | Where it renders | Example |
|---|---|---|
| `control-panel-template` | Windy Word's Control Panel | Echo HQ, Alpha Panel |
| `skill` | Windy Fly agent runtime | "Find apartments in NYC" |
| `tool` | Tool runtime (MCP-compat) | "Send Slack message" |
| `workflow` | Workflow runner | "Morning email triage" |
| `theme` | Any UI host | "Dark cyberpunk" |
| `voice-pack` | Windy Clone | "British narrator" |

New types are additive — each ships its own ADR and consumer surface.

## Status

🟢 **Foundation** (2026-05-21).

This is the very beginning. The repo is bootstrapped; the spec ADRs are pending; the SDK is unimplemented. Watch for milestones in `docs/MILESTONES.md` as they land.

## Companion repos

- **[`sneakyfree/windy-drops-site`](https://github.com/sneakyfree/windy-drops-site)** — marketing site at [windydrops.com](https://windydrops.com)
- **[`sneakyfree/windy-control-panel`](https://github.com/sneakyfree/windy-control-panel)** — first consumer surface (Vitals + Fleet protocols + host code + official dashboard drops)
- **[`sneakyfree/windy-connect`](https://github.com/sneakyfree/windy-connect)** — the CLI that hatches Windy agents (Eternitas credentials bundle is the sibling format Drops shares its philosophy with)

## Vision documents

- **ADR-053** — Windy Drops Substrate v1 (the universal artifact format)
- **ADR-054** — Control Panel Substrate v1 (the first surface)

Both pending acceptance at [`sneakyfree/kit-army-config/docs/`](https://github.com/sneakyfree/kit-army-config/tree/main/docs).

## License

MIT. This is open-source infrastructure for the whole agent ecosystem — anyone can publish drops, anyone can fork and run their own catalog, anyone can write a new consumer surface.

The Windy ecosystem is the reference issuer + reference consumer of the Drops format. Other ecosystems are welcome to adopt the same format and federate.
