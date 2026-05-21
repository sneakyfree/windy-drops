# DNA_STRAND_MASTER_PLAN.md — Windy Drops Substrate

**Version:** 0.1.0
**Created:** 2026-05-21
**Last Updated:** 2026-05-21
**Authors:** Grant Whitmer + Claude Opus 4.7 (1M context)
**Philosophy:** Even the dumbest ribosome can read the strand and replicate to an inevitable conclusion. Every strand below is self-contained — a contributor (or an agent) can pick one up, ship it, and the substrate grows toward its locked end-state without a designer in the loop.

---

## TERMINOLOGY STANDARD

| Internal / Technical | User-Facing (Authors) | User-Facing (Users) |
|---|---|---|
| Bundle (.zip with SKILL.md + assets) | **drop** | **drop** |
| Manifest frontmatter | **drop manifest** | (hidden) |
| R2 upload | **publish** | (hidden) |
| `windy-drops fork` command | **remix** | **fork** |
| Library row insert | **integrate** (button verb) | **integrate** |
| User's library table | **library** | **library** ("my stuff" informally) |
| Eternitas ES256 signature | **signed by [author]** | **verified author badge** |
| `pricing.type == "tip-jar"` | **tip-enabled drop** | **tip the author** |
| `forked_from` field | **lineage** | **forked from @author** |
| Trending algorithm | (hidden) | **trending tab** |
| Webhook delivery | (hidden) | (hidden) |

**Rule:** the marketplace UI prefers the **type-specific noun** ("install this **dashboard**", "install this **skill**") over the generic "drop." "Drop" is reserved for marketplace + author vernacular ("@OC5 dropped a new dashboard"). Grandma installs a dashboard; Gen Z follows new drops.

---

## VISION

Windy Drops is the universal content substrate for the Windy ecosystem. **One artifact format. One registry. One install API. Many types. Many consumer surfaces. Federation-shaped from day 1.** A kid in Seoul publishes a drop; a grandma in Florida scrolls past it in her Windy Chat trending tab; one tap and it's hers, rendering in her Control Panel forever.

**Core thesis (per ADR-053):** dashboards, skills, tools, themes, voice packs, workflows — they're all the same pattern. If we build "Control Panel templates" as a one-off, we rebuild the registry + install + trust + signing five more times. Stone foundation, not styrofoam.

**Independence thesis:** Drops is open infrastructure. MIT-licensed. Other ecosystems can adopt the SKILL.md format and federate. The Windy ecosystem is the reference issuer + reference consumer; it is not the only one.

**Petri dish thesis:** v1 ships with sandboxed live previews, fork-as-first-class-verb, share URLs that unfurl in Twitter/Discord/iMessage, author profiles, tip jars, and three authoring paths (CLI / web editor / AI-assisted). The growth loop is built in from day 1, not bolted on later.

**Marketplace as community accelerant.** 0% platform cut on tips (v1). 0% platform cut on paid drops (v1.1). 50% royalty default on paid forks. Web-first sidesteps Apple/Google IAP. Permissionless publish (Eternitas signing opt-in, not required for free drops).

---

## ECOSYSTEM CONTEXT

Windy Drops sits adjacent to the kernel quartet (Eternitas + Chat + Mail + Mind) and rides on the persistence substrate (Cloud R2). It is **not** a kernel — it is a content layer the kernels make possible.

```
                  ┌─────────────┐   ┌────────────┐
                  │  Eternitas  │   │ Cloudflare │
                  │  (trust /   │   │     R2     │
                  │   signing)  │   │ (bundles)  │
                  └──────┬──────┘   └──────┬─────┘
                         │                 │
                         └────────┬────────┘
                                  │
                  ┌───────────────▼─────────────────┐
                  │      WINDY DROPS REGISTRY       │
                  │  sneakyfree/windy-registry      │
                  │  FastAPI + Postgres + R2        │
                  │  publish • browse • install     │
                  │  fork • rate • tip • webhook    │
                  └───────────────┬─────────────────┘
                                  │
       ┌─────────────┬────────────┼────────────┬─────────────┐
       ▼             ▼            ▼            ▼             ▼
  Control Panel   Windy Chat  Marketplace   Author CLI    Federation
  (ADR-054)       trending    windydrops.   (TS + Py      peers (M9+)
  windy-pro +     tab         com/...       SDKs)
  windy-control-  (M7)        (M8)          (M3a + M3b)
  panel
```

Companion / sibling spec: `windy-connect/docs/bundle-spec-v1.md` is the **credentials** bundle (Eternitas passport + chat/mail/mind keys). Drops is the **content** counterpart. Different category, same SKILL.md + YAML frontmatter philosophy.

---

## DEPENDENCY GRAPH (CRITICAL PATH)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Phase A: WD-0 (JSON Schema, the source of truth)                           │
│         │                                                                    │
│         ├──► WD-1 (TS bindings) ──┐                                         │
│         ├──► WD-2 (Py bindings) ──┤                                         │
│         └──► WD-3 (conformance fixtures) ──┐                                │
│                                            │                                 │
│  Phase B: WD-4 (SDK scaffold) ◄────────────┘                                │
│         │                                                                    │
│         ├──► WD-5 (validate) ──┬──► WD-6 (bundle) ──┬──► WD-8 (publish)   │
│         │                       │                    │                       │
│         │                       └──► WD-7 (sign) ────┘                      │
│         │                                                                    │
│         ├──► WD-9 (withdraw)  WD-10 (fork)  WD-11 (byte-identity test)    │
│                                                                              │
│  Phase C: WD-12 (registry bootstrap) ──► WD-13 (R2) ──► WD-14 (Postgres)  │
│                                                                │             │
│           WD-15 (auth) ──┐                                     │             │
│           WD-16 (browse) ──► WD-17 (library) ──► WD-18 (publish-verify) ──► │
│           WD-19 (fork-svr)  WD-20 (rating)  WD-21 (webhooks)  WD-22 (backup)│
│                                                                              │
│  Phase D: WD-23 (iframe sandbox) ──► WD-24 (short URL + OG)                │
│           WD-25 (author profiles) ──► WD-26 (marketplace UI)                │
│                                                                              │
│  Phase E: WD-27 (Stripe Connect) ──► WD-28 (tip checkout)                  │
│           WD-29 (paid install, v1.1)  WD-30 (royalty + refund, v1.1)       │
│                                                                              │
│  Phase F: WD-31 (windy-control-panel — depends on WD-8 + WD-17)            │
│           WD-32 (Chat trending — depends on WD-21 webhook substrate)        │
│           WD-33 (AI authoring — v1.1, depends on WD-4 + Windy Mind)        │
│           WD-34 (federation sketch — depends on WD-18 + WD-15)              │
│                                                                              │
│  Legend: locked = v1 scope | reserved-v1.1 = scheme reserved, implements    │
│          6-8 weeks after v1 ship                                             │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Critical path to v1 substrate-ready:** WD-0 → WD-1+WD-2+WD-3 → WD-4 → WD-5 → WD-6 → WD-7 → WD-8 → WD-12 → WD-13 → WD-14 → WD-15 → WD-16 → WD-17 → WD-18 → WD-23 → WD-24. After WD-8 + WD-18 land, the loop is closed end-to-end (publish from SDK → verify on registry → install via library).

---

## CONFIRMED TECHNICAL DECISIONS (locked via ADR-053 + ADR-054)

| # | Decision | Choice | Source |
|---|---|---|---|
| 1 | Manifest format | SKILL.md + YAML frontmatter (`schema: windy.drop.v1`) | ADR-053 §"Drop format" |
| 2 | Source of truth | JSON Schema in `schemas/windy.drop.v1.json` — both SDK bindings codegen from it | ADR-053 §"Language bindings policy" |
| 3 | Language bindings | TypeScript + Python, **both first-class**, byte-identical output | ADR-053 §"Language bindings policy" |
| 4 | Registry stack | Python + FastAPI + Postgres + asyncpg + Alembic + R2 | ADR-053 §"The Registry" + ADR-013 |
| 5 | R2 bucket name | `windydrops-bundles` (per `<product>-<purpose>` convention; see AUDIT_2026-05-21.md Gap #1) | ADR-053 §"Bundle storage" + this plan correction |
| 6 | Public bundle domain | `drops.windydrops.com` (Cloudflare-proxied) | ADR-053 §"Bundle storage" |
| 7 | Sandbox iframe | Pulled from v2 INTO v1 — live previews from day 1 | ADR-053 §"Live preview & sandboxing" |
| 8 | Fork is first-class | `windy-drops fork`, `forked_from` field, lineage chain in registry | ADR-053 §"Remix & fork culture" |
| 9 | Eternitas signing | Opt-in for free drops; REQUIRED for paid drops (v1.1) | ADR-053 §"Signing + trust" + §"Creator-economy policy table" |
| 10 | Webhook contract | `X-Windy-Drops-Signature: sha256=<hex>`, HMAC-SHA256 over raw body | AUDIT_2026-05-21.md Gap #3 (matches windy-chat pattern) |
| 11 | Monetization v1 | Tip jars only (0% platform cut); paid drops + royalty schema-reserved for v1.1 | ADR-053 §"Creator-economy policy table" |
| 12 | Auth in registry | Dual JWKS: Pro RS256 (humans) + Eternitas ES256 (agents) | ADR-050 + ADR-053 §"Endpoints (v1)" |
| 13 | `/version` endpoint | Required from day 1 per MF1 reference impl (eternitas PR #74) | AUDIT_2026-05-21.md Gap #2 |
| 14 | Alembic migrations | Reversible downgrade tested per PR (MF7) | AUDIT_2026-05-21.md "Additional observations" |
| 15 | Postgres backup | s3 mirror + monthly restore drill (MF4) | AUDIT_2026-05-21.md "Additional observations" |
| 16 | AI-assisted authoring | Routes through Windy Mind OpenAI-compat `/v1/chat/completions` (BYOM-compliant; ADR-022) | ADR-053 §"AI integration roadmap" |
| 17 | License | MIT for the platform; drops declare their own SPDX | ADR-053 + windy-drops/README.md |

---

## TECH STACK (CONFIRMED)

### Spec + bindings (`windy-drops` monorepo)

| Layer | Choice | Version | Where |
|---|---|---|---|
| Schema source | JSON Schema 2020-12 | — | `schemas/windy.drop.v1.json` |
| TS bindings | Zod (codegen from JSON Schema via `json-schema-to-zod`) | Zod 3.23+ | `packages/artifact-spec` |
| Python bindings | Pydantic v2 (codegen via `datamodel-code-generator`) | Pydantic 2.7+ | `python/artifact-spec` |
| TS package mgr | npm workspaces | npm 10+ | root + `packages/*` |
| Python package mgr | uv | latest | `python/*` |

### TypeScript SDK (`@windy/drops-sdk`)

| Layer | Choice | Notes |
|---|---|---|
| Runtime | Node 20 LTS+ | min engine in package.json |
| CLI framework | `commander` 12+ | mature, small |
| Signing | `node:crypto` (built-in) | ES256 via `webcrypto` |
| HTTP client | `undici` (Node 20 built-in) | no axios |
| Zip | `archiver` 7+ | deterministic mode |
| Hash | `node:crypto` SHA-256 | base64 encoding |

### Python SDK (`windy-drops` on PyPI)

| Layer | Choice | Notes |
|---|---|---|
| Runtime | Python 3.11+ | match ecosystem services |
| CLI framework | `typer` 0.12+ | matches FastAPI ergonomics |
| Signing | `cryptography` 43+ | ES256 via `ec.ECDSA(SHA256())` |
| HTTP client | `httpx` 0.27+ | async + sync |
| Zip | `zipfile` (stdlib, deterministic params) | reproducible builds |
| Hash | `hashlib.sha256` | stdlib |

### Registry service (`sneakyfree/windy-registry`)

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Runtime | Python 3.11+ | match ecosystem services |
| API | FastAPI | 0.115+ | OpenAPI 3.1 auto-generation |
| ASGI | uvicorn | 0.30+ | `--workers 2` in prod |
| Database | PostgreSQL | 16+ | with `pgvector` reserved column for M9+ trending |
| ORM | SQLAlchemy 2.0 (async) | 2.0+ | asyncpg driver |
| Migrations | Alembic | 1.13+ | reversible downgrades (MF7) |
| Cache | Redis | 7+ | rate limit + webhook dedup |
| Auth (JWT verify) | `python-jose[cryptography]` | latest | dual JWKS (RS256 + ES256) |
| Stripe SDK | `stripe` | 10+ | Connect Express + Checkout |
| R2 client | `boto3` against R2 S3-compat endpoint | latest | use `windycloud-userdata` keypair (lockbox §"R2 Distribution Buckets") |
| Webhook delivery | `httpx` AsyncClient | 0.27+ | exponential backoff via `tenacity` |
| Container | Docker Compose 2.x | — | matches deploy-prod pattern |
| Reverse proxy | Caddy 2.7+ | — | TLS auto from CF origin cert |

### Port assignments

| Service | Port | Notes |
|---|---|---|
| windy-registry API | 8500 | FastAPI + uvicorn (next free port after windy-clone 8400) |
| Postgres | 5432 | internal only |
| Redis | 6379 | internal only |

### Production deploy target

- **EC2 host:** TBD at M4 (probably consolidated onto existing windymail/windycloud host or new t3.small)
- **Domain:** `api.windydrops.com` (registry) + `drops.windydrops.com` (bundle CDN, R2-direct)
- **Caddy:** terminates TLS, proxies to `localhost:8500`
- **R2 keypair:** lockbox §"R2 Distribution Buckets — Windy Desktop App Releases" (the `windycloud-userdata` "Apply to all buckets" scope works for `windydrops-bundles` too)

---

## CRITICAL INVARIANTS

These rules must NEVER be violated. Every strand below must respect them.

1. **Schema is the source of truth.** Both SDK bindings codegen from `schemas/windy.drop.v1.json`. No language-specific manifest extensions. A drop published from either SDK is byte-identical on R2 (ADR-053 acceptance criterion #8).

2. **Permissionless publish.** Free drops do NOT require Eternitas signing. Tier 1 free users CAN publish (per ADR-052). Trust signal is separate from gating. The only exception: paid drops in v1.1 REQUIRE signing as anti-abuse.

3. **Immutable bundles.** A drop at `<id>/<version>/` on R2 never mutates. Updates publish a new `<version>/`. Withdrawals hide from search but preserve installed-user functionality.

4. **Library is service-side state.** Surfaces query `/me/library?type=…`; they don't own library state. Adding a third Control Panel template = a `windy-drops publish` from any contributor's machine, NOT a windy-pro PR (ADR-054 acceptance criterion #6).

5. **Sandbox isolation is non-negotiable.** Bundles served from `drops.windydrops.com` (separate origin), `<iframe sandbox="allow-scripts">`, no parent-DOM access, no top-level navigation, postMessage-only host comms, CSP enforced. Violation = hostile drop attack vector.

6. **Fork lineage is preserved.** A fork that strips `forked_from` is a spec violation. The registry rejects publishes with mismatching lineage.

7. **0% platform cut on tips. Forever.** v1 and v1.1 both lock this. Changing it requires a new ADR.

8. **BYOM compliance for AI features.** Any LLM call from the SDK or registry MUST route through Windy Mind (`https://api.windymind.ai/v1`). No direct Anthropic/OpenAI SDK imports. Per ADR-022.

9. **`/version` from day 1.** Every deployed service (registry + future federation peers we ship) exposes `GET /version` per the MF1 contract. No auth, no DB dependency, must answer during incidents.

10. **Eternitas signing field shapes match `windy-connect/docs/bundle-spec-v1.md`.** Same `passport`, same `clearance_level` enum, same `integrity_band` enum, same JWKS URL. No re-vocabulary.

11. **Webhook HMAC matches the ecosystem pattern.** Header `X-Windy-Drops-Signature: sha256=<hex>`, HMAC-SHA256 over raw body. Matches Chat's `X-Windy-Signature` / `X-Eternitas-Signature` family.

12. **Forward-compatible by ignoring unknowns.** Consumers MUST ignore unknown manifest fields, unknown drop types, unknown webhook event types. v1.x is additive only.

---

## FILE INDEX (Target State)

```
windy-drops/                                       (sneakyfree/windy-drops; public, MIT)
├── schemas/
│   └── windy.drop.v1.json                         WD-0
├── packages/
│   ├── artifact-spec/                              WD-1   @windy/drops-artifact-spec
│   │   ├── src/index.ts                            (Zod codegen output + named exports)
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── sdk/                                        WD-4..WD-10   @windy/drops-sdk
│       ├── src/
│       │   ├── cli.ts                              (commander entry)
│       │   ├── commands/{new,validate,bundle,sign,publish,withdraw,fork}.ts
│       │   ├── lib/{r2,registry,eternitas,zip,hash}.ts
│       │   └── index.ts                            (library API)
│       ├── bin/windy-drops                          (executable shim → cli.js)
│       └── package.json
├── python/
│   ├── artifact-spec/                              WD-2   windy_drops_spec (PyPI)
│   │   ├── src/windy_drops_spec/__init__.py
│   │   ├── pyproject.toml
│   │   └── codegen.py                              (datamodel-code-generator invocation)
│   └── sdk/                                        WD-4..WD-10   windy-drops (PyPI)
│       ├── src/windy_drops/
│       │   ├── cli.py                              (typer app)
│       │   ├── commands/{new,validate,bundle,sign,publish,withdraw,fork}.py
│       │   ├── lib/{r2,registry,eternitas,zip,hash}.py
│       │   └── __init__.py
│       └── pyproject.toml
├── tools/
│   ├── conformance/                                WD-3, WD-11
│   │   ├── fixtures/                               (golden manifests + expected zips)
│   │   ├── compare-bundles.py                      (byte-identity check)
│   │   └── run.sh
│   └── codegen/
│       ├── ts-bindings.mjs                         (json-schema-to-zod runner)
│       └── py-bindings.py                          (datamodel-code-generator runner)
├── examples/                                       (one scaffold per drop type)
│   ├── control-panel-template-minimal/
│   ├── skill-minimal/
│   ├── theme-minimal/
│   └── ...
├── docs/
│   ├── README.md
│   ├── MILESTONES.md
│   ├── AUDIT_2026-05-21.md
│   ├── DNA_STRAND_MASTER_PLAN.md                   (this file)
│   ├── authoring-guide.md
│   └── versioning-policy.md
├── .github/workflows/
│   ├── ci.yml                                       (lint + test + conformance)
│   ├── publish-ts.yml                               (npm publish on tag)
│   └── publish-py.yml                               (PyPI publish on tag)
└── package.json                                    (npm workspaces root)


windy-registry/                                    (sneakyfree/windy-registry; private; WD-12+)
├── src/windy_registry/
│   ├── main.py                                     (FastAPI app factory)
│   ├── config.py                                   (Pydantic Settings)
│   ├── database.py                                 (async engine + session)
│   ├── routes/
│   │   ├── health.py                               WD-12  (/health)
│   │   ├── version.py                              WD-12  (/version, MF1)
│   │   ├── drops.py                                WD-16, WD-18, WD-19
│   │   ├── library.py                              WD-17
│   │   ├── ratings.py                              WD-20
│   │   ├── webhooks.py                             WD-21, WD-28
│   │   ├── authors.py                              WD-25
│   │   ├── follows.py                              WD-25
│   │   ├── stripe_connect.py                       WD-27
│   │   ├── tips.py                                 WD-28
│   │   ├── purchases.py                            WD-29
│   │   ├── short_url.py                            WD-24
│   │   └── federation.py                           WD-34
│   ├── models/                                     WD-14   (SQLAlchemy ORM)
│   ├── schemas/                                    (Pydantic request/response)
│   ├── services/
│   │   ├── signature_verify.py                     WD-18
│   │   ├── bundle_storage.py                       WD-13  (R2 upload/download)
│   │   ├── lineage.py                              WD-19
│   │   ├── trending.py                             WD-16  (trending algo v1)
│   │   ├── i18n.py                                 WD-22 (folded into routes/drops)
│   │   ├── composition.py                          WD-23 (folded into routes/drops/install)
│   │   ├── webhook_dispatcher.py                   WD-21
│   │   ├── stripe_client.py                        WD-27, WD-28
│   │   ├── og_metadata.py                          WD-24
│   │   └── sandbox_host.py                         WD-23
│   ├── middleware/
│   │   ├── auth.py                                 WD-15  (dual JWKS)
│   │   └── rate_limit.py                            WD-15  (Redis-backed)
│   └── utils/
├── alembic/                                        WD-14
│   ├── env.py
│   └── versions/
│       └── 0001_initial.py
├── tests/                                          (pytest + httpx AsyncClient)
├── deploy/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   ├── Dockerfile
│   ├── Caddyfile
│   ├── .env.example
│   └── SUBSTRATE.md                                (per ADR-048)
├── docs/
│   └── runbooks/
│       ├── backup-restore.md                       WD-22
│       └── deploy.md
├── pyproject.toml
└── README.md


windy-control-panel/                               (sneakyfree/windy-control-panel; WD-31)
├── packages/
│   ├── protocols/                                  (Vitals + Fleet TS types + JSON Schema)
│   │   ├── src/{vitals.ts,fleet.ts,index.ts}
│   │   └── package.json                            @windy/control-panel-protocols
│   ├── host-web/                                   (React SDK host for web)
│   │   └── src/{loader.tsx,sandbox.tsx,index.ts}
│   ├── host-electron/                              (Electron preload + renderer helper)
│   │   └── src/{preload.ts,renderer-loader.ts}
│   ├── official-drops/
│   │   ├── echo-hq/                                (Kit OC5 cyberpunk dashboard)
│   │   │   ├── SKILL.md
│   │   │   ├── render.js
│   │   │   ├── styles.css
│   │   │   └── preview.png
│   │   └── alpha-panel/                            (Kit OC1 alpha control panel)
│   └── sdk-extension/                              (control-panel-template type extension for @windy/drops-sdk)
├── tools/
│   └── port-from-ipc-bridge.sh                     (one-shot: copy IPC code from wp-echohq worktree)
├── docs/
│   ├── README.md
│   └── PROTOCOLS.md                                (Vitals v1 + Fleet v1 spec)
└── package.json                                    (npm workspaces)
```

---

# PHASE A — FOUNDATION (Manifest schema + bindings)

The four strands in Phase A produce the source of truth (JSON Schema) and the two language bindings that codegen from it. Every other strand depends on these.

**Phase A ships M2.** Estimated calendar: 1.5 working days.

---

### WD-0: Canonical JSON Schema

**Phase:** A
**Status:** done (2026-05-21 — Claude Opus 4.7)
**Owner:** Claude Opus 4.7 (1M context)
**Depends on:** —
**Blocks:** WD-1, WD-2, WD-3, WD-4 through WD-11, WD-18, WD-24

**Purpose:** Author the single source-of-truth JSON Schema for `windy.drop.v1` manifests. Both SDK bindings codegen from this file; the registry validates manifests against this file; conformance tests load fixtures against this file. One schema, one truth.

**Surface:**
- `schemas/windy.drop.v1.json` — JSON Schema 2020-12 document
- `schemas/README.md` — versioning policy stub (additive in v1.x; major bump for breaking changes; 12-month deprecation window for v1→v2 transition)
- Must encode every field from ADR-053 §"Universal frontmatter fields" (22 fields including `pricing`, `monetization`, `royalty`, `signature`, `forked_from`, `depends_on`, `preview_mock_data`, `locale_hint`)
- Must support i18n object form for `name` and `subtitle` (plain string OR `{<lang>: <str>, default: <lang>}`)
- `type` field must be enum: `["control-panel-template", "skill", "tool", "theme", "voice-pack", "workflow"]` plus an open-ended additive extension allowance via JSON Schema `unevaluatedProperties: true` at the namespaced section level
- Type-specific extensions live under a namespaced section (e.g., `control_panel:` for `type: control-panel-template`); schema uses `if/then` to validate per-type extensions

**Acceptance criteria:**
1. `npx ajv-cli compile -s schemas/windy.drop.v1.json` exits 0 (schema is itself valid)
2. `npx ajv-cli validate -s schemas/windy.drop.v1.json -d tools/conformance/fixtures/echo-hq.json` exits 0 for the Echo HQ golden manifest (from WD-3)
3. `npx ajv-cli validate -s schemas/windy.drop.v1.json -d tools/conformance/fixtures/invalid-no-author.json` exits 1 with error citing `author` field
4. `python -c "import jsonschema, json; jsonschema.validate(json.load(open('tools/conformance/fixtures/echo-hq.json')), json.load(open('schemas/windy.drop.v1.json')))"` succeeds
5. Author array form (`author: [...]`) is required (not single object); WD-0 enforces via `"type": "array", "minItems": 1`

**Implementation hints:**
- Use JSON Schema 2020-12 (NOT draft-07 or draft-2019-09) — it supports `$dynamicRef` and clean conditional validation
- `$id`: `https://schemas.windydrops.com/windy.drop.v1.json` (stable URL; serve from windy-drops-site later)
- Enums for `pricing.type`: `["free", "tip-jar", "paid", "subscription"]` — `paid` and `subscription` are schema-reserved but registry rejects them with `402` until v1.1
- `signature` block is optional at the schema level; the registry-side `WD-18` enforces "required if `pricing.type == paid`"
- Don't bake `surfaces:` enum — surfaces are open-ended (new ones add without schema bump)

**References:** ADR-053 §"Drop format" + §"Universal frontmatter fields" + §"Versioning policy"; AUDIT_2026-05-21.md.

---

### WD-1: TypeScript artifact-spec bindings

**Phase:** A
**Status:** done (2026-05-21 — Claude Opus 4.7)
**Owner:** Claude Opus 4.7 (1M context)
**Depends on:** WD-0
**Blocks:** WD-4 through WD-10 (TS side); WD-31 (Control Panel host needs typed manifests)

**Purpose:** Generate strongly-typed TypeScript bindings (Zod schemas + TypeScript types) from `schemas/windy.drop.v1.json` so authors get auto-complete + compile-time validation when writing drops in TypeScript.

**Surface:**
- `packages/artifact-spec/src/index.ts` — codegen output; named exports for `DropManifestSchema` (Zod), `DropManifest` (TS type), `DropType` (enum), `Pricing` (Zod), etc.
- `packages/artifact-spec/codegen.mjs` — script that runs `json-schema-to-zod` on `schemas/windy.drop.v1.json` and writes `src/index.ts`
- `packages/artifact-spec/package.json` — `"name": "@windy/drops-artifact-spec"`, `"version": "0.1.0"`, dependencies: `zod@^3.23`
- `packages/artifact-spec/README.md` — usage example
- npm script `pnpm codegen` (or `npm run codegen`) re-runs codegen and overwrites `src/index.ts`

**Acceptance criteria:**
1. `cd packages/artifact-spec && npm run codegen` exits 0; `src/index.ts` is regenerated and contains `export const DropManifestSchema`
2. `npm run build` (tsc) compiles cleanly
3. A test file `tests/parse.test.ts` does `DropManifestSchema.parse(echoHqManifest)` and succeeds; same for an invalid manifest and asserts the Zod error path includes the broken field
4. `npm pack` produces a tarball under 100KB
5. CI re-runs codegen on every PR and fails if `src/index.ts` is stale relative to `schemas/windy.drop.v1.json` (compare `git diff` after codegen)

**Implementation hints:**
- Use `json-schema-to-zod` v2+ — `npx json-schema-to-zod -i ../../schemas/windy.drop.v1.json -o src/index.ts -t DropManifestSchema`
- DO NOT hand-edit `src/index.ts` — comment at top says "GENERATED FILE. DO NOT EDIT. Run `npm run codegen` to regenerate."
- Export TypeScript types via `z.infer<typeof DropManifestSchema>`
- Discriminated union for `pricing.type` so TS narrows the type correctly
- Don't include the `signature` block in the published spec types as required — keep it optional everywhere

**References:** ADR-053 §"Language bindings policy"; WD-0 (source of truth).

---

### WD-2: Python artifact-spec bindings

**Phase:** A
**Status:** done (2026-05-21 — Claude Opus 4.7)
**Owner:** Claude Opus 4.7 (1M context)
**Depends on:** WD-0
**Blocks:** WD-4 through WD-10 (Python side); WD-18 (registry reuses these for manifest validation)

**Purpose:** Generate strongly-typed Python bindings (Pydantic v2 models) from `schemas/windy.drop.v1.json`. The registry's `WD-18` uses these for validation; the Python SDK uses them for `validate` / `publish`.

**Surface:**
- `python/artifact-spec/src/windy_drops_spec/__init__.py` — codegen output: `DropManifest`, `Pricing`, `Author`, `Signature`, etc., all Pydantic `BaseModel` subclasses
- `python/artifact-spec/codegen.py` — invokes `datamodel-code-generator` on `schemas/windy.drop.v1.json` and writes the module
- `python/artifact-spec/pyproject.toml` — `name = "windy-drops-spec"`, depends on `pydantic >= 2.7`
- `python/artifact-spec/README.md` — usage example

**Acceptance criteria:**
1. `cd python/artifact-spec && uv run python codegen.py` exits 0; `src/windy_drops_spec/__init__.py` is regenerated
2. `uv build` produces a wheel
3. `tests/test_parse.py` does `DropManifest.model_validate(echo_hq_manifest_dict)` and succeeds; for an invalid manifest, asserts `ValidationError` with path including the broken field
4. CI re-runs codegen and fails on staleness (same pattern as WD-1)
5. Pydantic discriminator works correctly for the `pricing.type` field

**Implementation hints:**
- Use `datamodel-code-generator` v0.25+: `uv run datamodel-codegen --input ../../schemas/windy.drop.v1.json --output src/windy_drops_spec/__init__.py --output-model-type pydantic_v2.BaseModel --input-file-type jsonschema --use-double-quotes`
- Header comment at top of generated file says "GENERATED FILE. DO NOT EDIT."
- Pydantic v2 strict mode for unknown fields: `model_config = ConfigDict(extra="ignore")` (consumers MUST ignore unknown fields per Invariant 12)
- For i18n object form, use `Union[str, dict[str, str]]` typing — datamodel-code-generator handles oneOf cleanly

**References:** ADR-053 §"Language bindings policy"; WD-0; ADR-013 (Marathon Stack).

---

### WD-3: Conformance fixtures (golden manifests)

**Phase:** A
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-0
**Blocks:** WD-1 (CI), WD-2 (CI), WD-11 (byte-identity test)

**Purpose:** Provide a small library of canonical "golden" manifests (and expected bundle zips) that both SDKs validate against and the conformance harness uses to prove byte-identity (WD-11).

**Surface:**
- `tools/conformance/fixtures/` — directory of `.json` (manifests) and `.zip` (expected bundle output) pairs
  - `echo-hq.json` + `echo-hq.zip` — control-panel-template, signed, has `forked_from: null`
  - `echo-hq-neon.json` + `echo-hq-neon.zip` — a fork of Echo HQ with `forked_from: "kit-oc5-echo-hq"`
  - `minimal-skill.json` + `minimal-skill.zip` — `type: skill`, no signature, free
  - `tip-enabled.json` + `tip-enabled.zip` — `monetization.tips_enabled: true`, Stripe-connected
  - `i18n-multilang.json` — `name` and `subtitle` as i18n objects (en/ko/ja)
  - `invalid-no-author.json` — missing `author` field; schema must reject
  - `invalid-unknown-type.json` — `type: not-a-real-type`; schema must reject
  - `invalid-paid-no-sig.json` — `pricing.type: paid`, missing `signature`; registry MUST reject (schema allows; WD-18 rejects)
- `tools/conformance/README.md` — how to add a new fixture

**Acceptance criteria:**
1. Every `*.json` validates against `schemas/windy.drop.v1.json` (or is explicitly in the `invalid-*` set)
2. Every valid fixture round-trips through both SDKs (parse → serialize → equal)
3. `invalid-*` fixtures fail validation with clear error paths
4. CI loads every fixture via both bindings (WD-1 + WD-2) and asserts shape equality

**Implementation hints:**
- Keep fixtures small (~30 LOC each). Don't bloat with realistic content; this is for schema verification, not user testing
- The `.zip` files should be deterministic (sorted entries, zero timestamps) so byte-comparisons work — see WD-6 implementation hints
- Sign `echo-hq.json` with a TEST Eternitas key (not a real key); include the test public key in `tools/conformance/test-keys/`

**References:** ADR-053 §"Acceptance criteria" #8 (byte-identity); WD-0; WD-11.

---

# PHASE B — SDKS (TypeScript + Python authoring tools)

Phase B ships M3a + M3b in parallel. Both SDKs share the same CLI surface (`windy-drops <command>`) and produce byte-identical R2 bundles. A drop published from either SDK is indistinguishable to the registry (WD-11 enforces).

**Phase B ships M3a + M3b.** Estimated calendar: 3 working days (1.5 each, in parallel).

---

### WD-4: SDK monorepo scaffold + `new` command

**Phase:** B
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-1, WD-2, WD-3
**Blocks:** WD-5, WD-6, WD-7, WD-8, WD-9, WD-10

**Purpose:** Set up the TS + Python SDK package skeletons, wire the CLI entry points, and implement `windy-drops new --type <type> <path>` which scaffolds a starter drop directory (SKILL.md + per-type starter assets).

**Surface:**
- `packages/sdk/` (TS): `package.json` with `"name": "@windy/drops-sdk"`, `"bin": {"windy-drops": "bin/windy-drops"}`, deps: `commander@^12`, `@windy/drops-artifact-spec` (workspace), `chalk@^5`, `inquirer@^9`
- `packages/sdk/src/cli.ts` — commander root, registers subcommands lazily
- `packages/sdk/src/commands/new.ts` — implements `windy-drops new --type <type> <path>`
- `packages/sdk/bin/windy-drops` — executable shim that requires `dist/cli.js`
- `python/sdk/pyproject.toml` — `[project] name = "windy-drops"`, `dependencies = ["typer>=0.12", "windy-drops-spec>=0.1"]`, `[project.scripts] windy-drops = "windy_drops.cli:app"`
- `python/sdk/src/windy_drops/cli.py` — typer app, mounts subcommands
- `python/sdk/src/windy_drops/commands/new.py` — `new` command
- `examples/` directory with one per-type scaffold (control-panel-template, skill, theme, voice-pack, workflow, tool) — these are the templates `new` copies
- Both SDKs print identical UX: `windy-drops new --type control-panel-template ./my-dashboard` → creates dir with SKILL.md + render.js + styles.css + preview.png placeholder

**Acceptance criteria:**
1. `npm install -g @windy/drops-sdk@0.1.0` (from local pack) + `windy-drops --version` prints `0.1.0`
2. `pip install <local wheel>` + `windy-drops --version` prints `0.1.0`
3. `windy-drops new --type control-panel-template ./tmp-dashboard` creates `./tmp-dashboard/SKILL.md` with valid frontmatter (validates against WD-0)
4. Both SDKs' `--help` output is identical (modulo wording variations: same subcommands, same flag names)
5. Running `new` on an existing non-empty directory exits 1 with a clear error

**Implementation hints:**
- TS: use `commander`'s lazy-load pattern (`.action(async () => { (await import('./commands/new')).run(...) })`) to keep startup fast
- Python: use `typer`'s `add_typer` pattern for sub-apps
- Scaffolds live in `examples/<type>-minimal/` — both SDKs read from there (not from inline string templates) so updating an example automatically updates the scaffold
- Use `inquirer` (TS) / `questionary` or `typer.prompt` (Py) only if `--type` is missing; otherwise non-interactive
- Don't bake the author's identity into scaffolds (placeholder `author: [{name: "Your Name"}]`)

**References:** ADR-053 §"Authoring paths" Path 1; WD-1; WD-2.

---

### WD-5: SDK `validate` command

**Phase:** B
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-4
**Blocks:** WD-6 (bundle should fail-fast on invalid manifests)

**Purpose:** `windy-drops validate <path>` parses the SKILL.md frontmatter, validates against the JSON Schema (via WD-1/WD-2 bindings), and emits clear errors with file:line pointers. No network calls; pure local validation.

**Surface:**
- TS: `packages/sdk/src/commands/validate.ts` — parses `<path>/SKILL.md`, splits frontmatter from body, parses YAML, runs Zod schema, reports
- Python: `python/sdk/src/windy_drops/commands/validate.py` — same flow with `pydantic.BaseModel.model_validate`
- Shared YAML parser: TS uses `yaml@^2.4`, Python uses `ruamel.yaml`
- Error format: `<file>:<line>: <field-path>: <error-message>` — both SDKs produce identical-shape error output
- Exit code: 0 if valid, 1 if invalid

**Acceptance criteria:**
1. `windy-drops validate examples/control-panel-template-minimal/` exits 0
2. `windy-drops validate tools/conformance/fixtures/invalid-no-author/` (a directory with `SKILL.md` containing that fixture) exits 1 with error message including `author`
3. Both SDKs' validate output for the same invalid manifest matches structurally (same error count, same field paths)
4. `windy-drops validate <path>` exits 1 if `<path>/SKILL.md` is missing
5. `windy-drops validate <path>` warns (not errors) on unknown extension fields (forward-compat)

**Implementation hints:**
- The frontmatter split is a regex on `^---\n` ... `\n---\n` — handle both LF and CRLF; reject if no closing `---`
- Use the YAML parser's line-number metadata to map errors back to source lines
- For Pydantic, walk `error.errors()` and re-format with the original YAML line numbers
- Don't depend on a markdown parser — only the frontmatter matters; body is opaque

**References:** WD-0; WD-1; WD-2; ADR-053 §"Universal frontmatter fields".

---

### WD-6: SDK `bundle` command (zip + SHA-256)

**Phase:** B
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-5
**Blocks:** WD-7, WD-8, WD-11

**Purpose:** `windy-drops bundle <path>` produces a deterministic zip file of the drop directory and computes its SHA-256 digest. **Deterministic** means: bit-identical zips from both SDKs for the same input directory.

**Surface:**
- TS: `packages/sdk/src/commands/bundle.ts` — uses `archiver` with explicit `mode`, `mtime: new Date(0)`, sorted entry order
- Python: `python/sdk/src/windy_drops/commands/bundle.py` — uses `zipfile.ZipFile` with `ZIP_DEFLATED`, explicit `date_time=(1980, 1, 1, 0, 0, 0)` for every `ZipInfo`, sorted file walk
- Both SDKs emit `<drop-id>-<version>.zip` and `<drop-id>-<version>.sha256` (hex-encoded digest, single line)
- Exclude rules: `.git/`, `node_modules/`, `*.pyc`, `__pycache__/`, `.DS_Store`, anything matching `.windyignore` glob patterns

**Acceptance criteria:**
1. `windy-drops bundle examples/control-panel-template-minimal/` produces a zip; `sha256sum` of the zip matches the `.sha256` file
2. **WD-11 dependency:** running the same `bundle` on the same input via TS SDK and Python SDK produces byte-identical zips (`cmp` returns 0)
3. The zip's central directory entries are sorted lexicographically
4. Every entry's mtime is the Unix epoch (1970-01-01) — independent of file system mtime
5. `windy-drops bundle <path-with-validation-errors>/` exits 1 before producing the zip (calls `validate` first)

**Implementation hints:**
- `archiver` (TS): use `archive.append(content, { name, date: new Date(0), mode: 0o644 })` and call `.directory(path, false, (entry) => { entry.date = new Date(0); entry.mode = 0o644; return entry })` — but archiver's deterministic mode is finicky; verify with `cmp` against Python output
- Python: must explicitly set `external_attr = (0o644 & 0xFFFF) << 16` to match archiver's permission bits
- Sort file walk: `sorted(os.walk(path))` (Python); manually traverse with `fs.readdirSync().sort()` (TS)
- `.windyignore` is gitignore-syntax — use `ignore` (TS) and `pathspec` (Python) libraries
- Test on macOS + Linux + Windows file systems (WD-11 catches divergence)

**References:** ADR-053 §"Bundle storage"; WD-11 (byte-identity test).

---

### WD-7: SDK `sign` command (Eternitas ES256)

**Phase:** B
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-5, WD-6
**Blocks:** WD-8 (publish flows `sign` → upload), WD-18 (registry-side verify)

**Purpose:** `windy-drops sign <path>` reads the author's Eternitas Passport private key from local credentials, computes `signed_digest = sha256(canonical_manifest_sans_signature || bundle_sha256)`, signs with ES256, and writes the `signature:` block back into SKILL.md.

**Surface:**
- TS: `packages/sdk/src/commands/sign.ts` + `packages/sdk/src/lib/eternitas.ts`
- Python: `python/sdk/src/windy_drops/commands/sign.py` + `python/sdk/src/windy_drops/lib/eternitas.py`
- Local credentials: read EPT from `~/.windy/credentials.json` (placed there by `windy connect` per `windy-connect/docs/bundle-spec-v1.md`); private key from the same file's `eternitas.private_key` field (PEM-encoded EC P-256)
- Canonical manifest: YAML frontmatter parsed → sort keys → strip `signature:` block → re-serialize to canonical JSON (sorted keys, no whitespace) before hashing
- Output: SKILL.md with `signature:` block populated (algorithm, signer.passport, signer.integrity_band, signer.clearance_level, signed_at, signed_digest, signature)

**Acceptance criteria:**
1. `windy-drops sign ./test-drop` (with `~/.windy/credentials.json` containing a TEST private key + passport) writes a `signature:` block; re-running validates with WD-5
2. The `signed_digest` field is computed as `sha256(canonical_manifest_sans_signature || bundle_sha256_hex)` — both SDKs must agree (WD-11 conformance covers this)
3. The `signature` field is a base64-encoded raw ES256 signature (R||S concatenation, 64 bytes total → 88-char base64); not DER-encoded
4. Re-signing an already-signed manifest replaces the existing block (idempotent)
5. `windy-drops sign` exits 1 if `~/.windy/credentials.json` is missing or lacks an `eternitas.private_key` field

**Implementation hints:**
- TS: `crypto.createSign('SHA256')` + `key.sign({key, dsaEncoding: 'ieee-p1363'})` — `ieee-p1363` produces raw R||S, which is what JWKS verification expects
- Python: `cryptography.hazmat.primitives.asymmetric.ec.ECDSA(hashes.SHA256())` — note that PyCA returns DER by default; convert to raw R||S via `cryptography.hazmat.primitives.asymmetric.utils.decode_dss_signature` then pack with `int.to_bytes(32, 'big')`
- Pull `signer.integrity_band` + `signer.clearance_level` from Eternitas API at sign time: `GET https://api.eternitas.ai/api/v1/passports/<passport>/status` — these are snapshot-at-signing-time; the registry stores them but does NOT continuously update
- The canonical manifest serialization MUST be deterministic across TS + Py — use `JSON.stringify(obj, Object.keys(obj).sort())` (TS) and `json.dumps(obj, sort_keys=True, separators=(',',':'))` (Py); verify byte-identity in WD-11

**References:** ADR-053 §"Signing + trust"; windy-connect bundle-spec-v1.md §"eternitas block"; AUDIT_2026-05-21.md Bucket 3.

---

### WD-8: SDK `publish` command (R2 upload + registry POST)

**Phase:** B
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-6, WD-7 (signing is optional but supported)
**Blocks:** WD-31 (Control Panel official drops publish via this), WD-32 (any author publishing via Drops)

**Purpose:** `windy-drops publish <path>` runs validate → bundle → (optional sign) → upload zip to R2 at `<drop-id>/<version>/<drop-id>-<version>.zip` → POST manifest + bundle URL + digest to the registry. End-to-end author publishing flow.

**Surface:**
- TS: `packages/sdk/src/commands/publish.ts` + `lib/r2.ts` + `lib/registry.ts`
- Python: same shape
- R2 upload: S3-compatible API via `@aws-sdk/client-s3` (TS) or `boto3` (Python), targeting `https://<account>.r2.cloudflarestorage.com` with the `windycloud-userdata` keypair (works across all buckets per lockbox)
- Registry POST: `POST https://api.windydrops.com/api/v1/drops` with `Authorization: Bearer <user JWT or EPT>`, body: `{manifest: <full SKILL.md frontmatter>, bundle_url, bundle_sha256, signature?}`
- Auth: read `~/.windy/credentials.json` for `eternitas.ept` (agents) or run OAuth flow (humans, deferred to web SDK); v1 SDK requires the credentials file to exist
- Exit-code semantics: 0 = published, 1 = validation/upload/registry error (with exit-code disambiguation: 2 = unauthorized, 3 = bundle conflict, 4 = R2 error)

**Acceptance criteria:**
1. `windy-drops publish ./echo-hq-test` succeeds against a staging registry; output prints the canonical drop URL: `https://windydrops.com/d/<id>`
2. Publishing the same `id@version` twice exits 3 (conflict) — versions are immutable
3. Publishing the same `id` with a bumped version succeeds
4. If R2 upload succeeds but registry POST fails, the SDK retries the registry POST (idempotent — registry deduplicates on `bundle_sha256`)
5. `--dry-run` flag prints what would be uploaded + posted without doing either; exits 0
6. Both SDKs produce the same R2 path + same bundle_sha256 for the same input (covered by WD-11)

**Implementation hints:**
- R2 endpoint discovery: `https://<account_id>.r2.cloudflarestorage.com` — account ID is `193b347aedeaafe35de0b5a534b2d9aa` (per memory `reference_cloudflare_infrastructure`); accept via `WINDY_R2_ACCOUNT_ID` env or fetch from a public well-known JSON at `https://api.windydrops.com/.well-known/r2-config`
- Don't hard-code the R2 endpoint in source; fetch from registry's `/well-known/r2-config` (registry serves this in WD-12)
- Bundle path: `<drop-id>/<version>/<drop-id>-<version>.zip` — also upload `<drop-id>/<version>/SKILL.md` (unzipped, for cheap preview fetches) and `<drop-id>/<version>/preview.png` (extracted from zip)
- Registry POST is HTTPS-only; never accept self-signed certs in production
- HTTP retries: 3 attempts with exponential backoff (1s, 2s, 4s); 408/429/5xx retry, 4xx fail-fast

**References:** ADR-053 §"Author flow" + §"Endpoints (v1)" `POST /api/v1/drops`; lockbox R2 keypair.

---

### WD-9: SDK `withdraw` command

**Phase:** B
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-8
**Blocks:** —

**Purpose:** `windy-drops withdraw <drop-id>` hides a drop from search and trending. Existing installed users keep working (immutable bundles stay on R2). Re-publishing requires explicit confirmation.

**Surface:**
- TS + Py: `commands/withdraw.{ts,py}` — `windy-drops withdraw <drop-id> [--confirm]`
- HTTP: `DELETE https://api.windydrops.com/api/v1/drops/<drop-id>` with author auth
- Confirms by typing the drop ID unless `--confirm` provided

**Acceptance criteria:**
1. `windy-drops withdraw echo-hq-test --confirm` succeeds (200/204) against a staging registry
2. After withdrawal, `GET /api/v1/drops?q=echo-hq-test` returns no results
3. `GET /api/v1/drops/echo-hq-test` still returns the manifest (admin/installed-user visibility preserved) with `withdrawn_at` field populated
4. Re-publishing the same `id` requires the SDK to detect the withdrawn state and prompt the author for confirmation
5. Withdraw fails (403) if the caller isn't an author of the drop

**Implementation hints:**
- Withdraw doesn't delete R2 bytes — installed users still need access
- Withdraw is reversible by re-publishing; the registry tracks `withdrawn_at` + `restored_at`
- Author identity check on registry side reads from `author[].passport` against the requester's EPT

**References:** ADR-053 §"Author flow" §"Withdrawing".

---

### WD-10: SDK `fork` command

**Phase:** B
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-4
**Blocks:** WD-19 (server-side fork records depend on this client format)

**Purpose:** `windy-drops fork <source-drop-id> <new-id>` clones the source bundle to `./<new-id>/`, rewrites the manifest (new id, new author, `forked_from: <source-id>`, version reset to 1.0.0), and prepares for `publish`.

**Surface:**
- TS + Py: `commands/fork.{ts,py}`
- HTTP: `GET https://api.windydrops.com/api/v1/drops/<source-drop-id>` for source manifest + bundle URL; download bundle from R2; unzip locally
- Rewrites: `id`, `author` (replaces with current user from `~/.windy/credentials.json`), `forked_from: <source-id>`, `version: 1.0.0`
- Optionally calls `POST /api/v1/drops/<source-id>/fork` with `{new_id, new_name}` to register lineage server-side BEFORE publish (so the fork count increments immediately even pre-publish; WD-19 implements server side)

**Acceptance criteria:**
1. `windy-drops fork kit-oc5-echo-hq my-echo-hq-neon` creates `./my-echo-hq-neon/` with rewritten SKILL.md
2. The new SKILL.md validates (WD-5) and has `forked_from: "kit-oc5-echo-hq"`
3. The new author is the current user (`~/.windy/credentials.json` → `eternitas.passport`)
4. Forking a free drop preserves `pricing.type: free` by default; forking a paid drop preserves `pricing.type: paid` with the original price (per ADR-053 royalty default)
5. Forking a free drop into a paid drop in the SDK is allowed at the SKILL.md level but registry-side `WD-18` rejects publish unless the original author has consented (v1.1)

**Implementation hints:**
- Don't auto-publish on fork; the user must `cd <new-id> && windy-drops publish` separately
- Preserve preview.png + assets but reset preview_mock_data if it referenced source-specific data
- `--new-name` flag for the i18n `name` rewrite; defaults to `<source-name> (forked)`
- The server-side `POST /drops/<source>/fork` is OPTIONAL — failing it doesn't block local fork creation, just defers lineage registration to publish-time

**References:** ADR-053 §"Remix & fork culture"; WD-19 (server fork endpoint).

---

### WD-11: Cross-SDK byte-identity conformance harness

**Phase:** B
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-3, WD-6, WD-7, WD-10
**Blocks:** v1 ship (per ADR-053 acceptance criterion #8 — "if criterion 8 fails, we redesign before either SDK ships v1.0.0")

**Purpose:** CI test that runs both SDKs against every fixture in WD-3 and asserts byte-identical bundle outputs + identical signature digests + identical canonical manifest serialization. This is the proof that the protocol hasn't leaked into the SDK layer.

**Surface:**
- `tools/conformance/run.sh` — orchestrates: for each fixture, `npx @windy/drops-sdk bundle <fixture>` + `python -m windy_drops bundle <fixture>` + `cmp <ts-output>.zip <py-output>.zip`
- `tools/conformance/compare-bundles.py` — helper that does deep zip comparison (entries, sizes, mtimes, content hashes) with clear diff output on mismatch
- `.github/workflows/conformance.yml` — runs `tools/conformance/run.sh` on every PR; fails CI if any fixture diverges
- For signed fixtures: both SDKs sign with the same TEST private key (`tools/conformance/test-keys/test-private.pem`) and assert identical signatures

**Acceptance criteria:**
1. `tools/conformance/run.sh` exits 0 against the WD-3 fixture set; outputs `PASS` for each fixture
2. If WD-6 introduces non-determinism in either SDK, this script catches it (mock a regression by adding mtime variance; harness should fail)
3. CI runs in <2 minutes
4. The harness prints clear diff output on divergence (e.g., "entry `render.js` differs at byte 1024: TS=0x42 PY=0x43")

**Implementation hints:**
- Don't use `archive sha256` for comparison — different zip compression strategies can produce different bytes for the same content; compare entry-by-entry instead
- Test the failure mode explicitly: add a known-divergent fixture, assert the harness catches it, then remove it
- The harness is the gate for v1.0.0 of both SDKs

**References:** ADR-053 §"Acceptance criteria" #8; WD-3 (fixtures); WD-6 (deterministic bundle).

---

# PHASE C — REGISTRY SERVICE (FastAPI + Postgres + R2)

The registry is the core service: it indexes drops, validates publishes, serves browse + install + library, propagates webhooks. Lives in `sneakyfree/windy-registry` (separate repo from windy-drops). Python + FastAPI per ADR-013 Marathon Stack.

**Phase C ships M4 + M5.** Estimated calendar: 5 working days.

---

### WD-12: Registry repo bootstrap + FastAPI + Docker + `/version`

**Phase:** C
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-0 (uses schema for validation)
**Blocks:** WD-13, WD-14, WD-15, WD-16+ (everything else in Phase C)

**Purpose:** Create the `sneakyfree/windy-registry` repo with the FastAPI scaffold, Docker Compose setup (postgres + redis + api), Caddy reverse proxy, deployable to a staging EC2 host. Includes `/version` endpoint per MF1 from day 1 and `/health` endpoints.

**Surface:**
- New repo: `sneakyfree/windy-registry` (private; can flip public later)
- `pyproject.toml` with deps: fastapi, uvicorn, sqlalchemy[asyncio], asyncpg, alembic, pydantic-settings, python-jose[cryptography], httpx, boto3, redis, tenacity, stripe
- `src/windy_registry/main.py` — FastAPI app factory + lifespan + middleware
- `src/windy_registry/config.py` — Settings via `pydantic-settings`
- `src/windy_registry/database.py` — async engine + session
- `src/windy_registry/routes/health.py` — `GET /health` (process up) + `GET /health/full` (DB + R2 + Eternitas JWKS reachable)
- `src/windy_registry/routes/version.py` — MF1 contract: `{service: "windy-registry", version, commit_sha, commit_sha_short, build_timestamp, started_at, environment}` — no auth, no DB
- `deploy/docker-compose.yml` + `deploy/docker-compose.prod.yml` (per `feedback_windy_chat_compose_invocation` pattern: both required)
- `deploy/Dockerfile` — multi-stage; `ARG COMMIT_SHA` + `ARG BUILD_TIMESTAMP` injected as ENV vars
- `deploy/Caddyfile` — `api.windydrops.com { reverse_proxy localhost:8500 }`
- `deploy/SUBSTRATE.md` — operational substrate documented per ADR-048
- `.github/workflows/ci.yml` — lint (ruff) + test (pytest) on PR
- `.github/workflows/deploy.yml` — rsync-from-runner pattern per `feedback_mind_auto_deploy_unwired` resolution
- `deploy/.env.example` — all env vars documented

**Acceptance criteria:**
1. `cd windy-registry && docker compose up -d` brings the stack up; `curl localhost:8500/health` returns 200
2. `curl localhost:8500/version` returns the MF1 contract shape with `service: "windy-registry"`, `commit_sha` non-null when built via CI
3. `pytest tests/test_version.py` validates the MF1 contract (copy from eternitas reference impl)
4. `/version` works even if Postgres is down (the test should bring down the DB and assert `/version` still 200s)
5. Deployed to staging EC2 host; `curl https://api.windydrops.com/version` succeeds
6. `deploy/SUBSTRATE.md` documents: bind-mount paths, env file location, compose-name, deploy command

**Implementation hints:**
- Copy `/version` route from `eternitas/src/eternitas/routes/version.py` (PR #74) — change service name + module path; everything else is identical
- Compose project name: explicit `name: windy-registry-prod` directive per `feedback_compose_project_name_collision` (ADR-046)
- Caddy reload via `caddy reload --config Caddyfile` (NEVER restart per `feedback_caddy_inode_binding_v2`)
- Port 8500 in `feedback_windy_chat_compose_invocation` and other deploy memories is example; use 8500 specifically
- Rate-limit middleware skip-list MUST include `/version` and `/health`
- For `--force-recreate` on env changes: per `feedback_compose_restart_envfile`, `restart` reuses env; only `up -d --force-recreate` picks up new vars

**References:** ADR-053 §"The Registry"; ADR-013; ADR-048 (substrate-as-code); MF1 reference impl; `reference_version_endpoint_contract`.

---

### WD-13: R2 bucket + custom domain `drops.windydrops.com`

**Phase:** C
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-12
**Blocks:** WD-8 (SDK uploads here), WD-18 (registry reads bundles from here)

**Purpose:** Provision the `windydrops-bundles` R2 bucket and attach the custom domain `drops.windydrops.com` via Cloudflare R2-domains API. Bundles are immutable; public-read; HTTPS via CF proxy.

**Surface:**
- R2 bucket: `windydrops-bundles` (account `193b347aedeaafe35de0b5a534b2d9aa`, region `wnam` to match ecosystem)
- Custom domain: `drops.windydrops.com` → R2 bucket (via `POST /accounts/<acct>/r2/buckets/windydrops-bundles/domains/custom`)
- CORS rule on the bucket: `Access-Control-Allow-Origin: https://windydrops.com` + `https://*.windydrops.com` (for marketplace UI fetching previews); `Access-Control-Allow-Methods: GET`; `Access-Control-Max-Age: 3600`
- Public-read access on bucket (drops are public by design); auth is at registry layer, not bucket
- Bucket structure: `<drop-id>/<version>/<drop-id>-<version>.zip` + `<drop-id>/<version>/SKILL.md` + `<drop-id>/<version>/preview.png`
- `tools/r2-provision.sh` script in windy-registry repo for one-shot setup (idempotent)
- Bucket lifecycle: NO automatic deletion — bundles are immutable forever for installed-user access

**Acceptance criteria:**
1. After running `tools/r2-provision.sh`: `curl https://drops.windydrops.com/test/1.0.0/SKILL.md` returns 200 for a manually-uploaded test file (404 before upload)
2. CORS preflight `curl -X OPTIONS -H 'Origin: https://windydrops.com' https://drops.windydrops.com/test/...` returns ACAO header
3. SSL cert is automatic via CF proxy (no manual cert provisioning)
4. The bucket is referenced in `deploy/.env.example` as `R2_BUCKET=windydrops-bundles`, `R2_PUBLIC_DOMAIN=drops.windydrops.com`
5. Registry's `bundle_storage.py` service uploads + downloads against the bucket using the `windycloud-userdata` keypair (per lockbox; works "Apply to all buckets")
6. R2 config (account_id + bucket + public_domain) served from `GET /well-known/r2-config` on the registry (the SDK fetches this in WD-8)

**Implementation hints:**
- Use the **TheWindstormCloudflareGodToken** for bucket creation + domain attach — pull from `~/kit-army-config/ACCESS_LOCKBOX.md` at run time; never commit. Per `reference_r2_desktop_distribution_pattern` and `feedback_cf_kv_token_gap`.
- Verify with `curl -H 'Authorization: Bearer $GOD_TOKEN' https://api.cloudflare.com/client/v4/accounts/<acct>/r2/buckets/windydrops-bundles` returns 200
- DNS record auto-created by CF on custom-domain attach; verify with `dig drops.windydrops.com`
- Bucket name correction from ADR-053's `windy-drops` to `windydrops-bundles` is per AUDIT_2026-05-21.md Gap #1 — propose a one-line ADR-053 footnote update when this strand lands

**References:** ADR-053 §"Bundle storage"; `reference_r2_desktop_distribution_pattern`; `reference_cloudflare_infrastructure`; AUDIT_2026-05-21.md Gap #1.

---

### WD-14: Postgres schema + Alembic (reversible migrations)

**Phase:** C
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-12
**Blocks:** WD-15+ (all data-touching strands)

**Purpose:** Define the SQLAlchemy ORM models for drops, versions, authors, libraries, forks, ratings, follows, webhook subscriptions, tips, purchases. Initial Alembic migration with tested `downgrade()` per MF7.

**Surface:**
- `src/windy_registry/models/{drop,drop_version,author,user_library,fork,rating,follow,webhook_subscription,webhook_delivery,tip,purchase,refund}.py` — SQLAlchemy 2.0 async models
- `alembic/env.py` — async env per asyncpg + SQLAlchemy 2.0 pattern
- `alembic/versions/0001_initial.py` — creates all tables with explicit indices and FKs; includes a tested `downgrade()` per MF7
- Reserved column for M9+ trending (`drop.embedding pgvector(384)` — nullable; populated by future ML pipeline)

**Schema sketch (load-bearing tables):**
```sql
CREATE TABLE drops (
  id TEXT PRIMARY KEY,
  current_version TEXT NOT NULL,
  type TEXT NOT NULL,
  forked_from TEXT REFERENCES drops(id) ON DELETE SET NULL,
  withdrawn_at TIMESTAMPTZ,
  embedding vector(384),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_drops_type ON drops(type);
CREATE INDEX idx_drops_forked_from ON drops(forked_from);

CREATE TABLE drop_versions (
  drop_id TEXT NOT NULL REFERENCES drops(id),
  version TEXT NOT NULL,
  manifest JSONB NOT NULL,  -- full SKILL.md frontmatter
  bundle_url TEXT NOT NULL,
  bundle_sha256 TEXT NOT NULL,
  signature_verified BOOLEAN DEFAULT FALSE,
  signer_passport TEXT,
  signer_integrity_band TEXT,
  published_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (drop_id, version)
);

CREATE TABLE user_library (
  user_id UUID NOT NULL,
  drop_id TEXT NOT NULL REFERENCES drops(id),
  version TEXT NOT NULL,
  installed_at TIMESTAMPTZ DEFAULT now(),
  auto_update BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (user_id, drop_id)
);

CREATE TABLE forks (
  source_drop_id TEXT NOT NULL REFERENCES drops(id),
  fork_drop_id TEXT NOT NULL REFERENCES drops(id),
  forked_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (source_drop_id, fork_drop_id)
);

-- ratings, follows, webhook_subscriptions, webhook_deliveries, tips, purchases, refunds similarly
```

**Acceptance criteria:**
1. `alembic upgrade head` succeeds on a fresh Postgres
2. `alembic downgrade base` succeeds (MF7 — every migration has a tested downgrade)
3. `pytest tests/test_migrations.py::test_upgrade_downgrade_roundtrip` passes
4. `pgvector` extension is installed in the migration (`CREATE EXTENSION IF NOT EXISTS vector`)
5. Booleans use `sa.false()` / `sa.true()` (not `sa.text("0")`) per `feedback_boolean_server_default_dialect_trap`
6. All FKs have `ON DELETE` clauses explicitly set

**Implementation hints:**
- Use `Mapped[]` typing + `mapped_column()` (SQLAlchemy 2.0 style); not the legacy `Column()` API
- `JSONB` for manifests gives flexibility for the type-namespaced extensions
- For pgvector: `from pgvector.sqlalchemy import Vector` + `embedding: Mapped[list[float] | None] = mapped_column(Vector(384), nullable=True)`
- Test downgrade by creating a fixture in the upgraded state, running downgrade, then re-running upgrade — fixture should be re-creatable

**References:** ADR-053 §"Library state"; MF7 reference impl; `feedback_boolean_server_default_dialect_trap`.

---

### WD-15: Auth middleware (dual JWKS — Pro RS256 + Eternitas ES256)

**Phase:** C
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-12
**Blocks:** WD-16, WD-17, WD-18, WD-19, WD-20, WD-25, WD-27, WD-28 (all auth-gated endpoints)

**Purpose:** Validate incoming JWTs against either the Pro account-server JWKS (RS256 — human users) or Eternitas JWKS (ES256 — agents). Populate `request.state.user = {id, passport?, tier, integrity_band?}` for downstream handlers.

**Surface:**
- `src/windy_registry/middleware/auth.py` — FastAPI dependency that decodes Bearer token, fetches appropriate JWKS, verifies signature, extracts claims
- JWKS sources:
  - Pro RS256: `https://account.windyword.ai/.well-known/jwks.json` (per `feedback_jwks_split_brain` — use `account.windyword.ai`, NOT `api.windyword.ai`)
  - Eternitas ES256: `https://api.eternitas.ai/.well-known/eternitas-keys`
- JWKS cache: in-memory with 5-min TTL (per windy-chat pattern); fetch on cache miss + on `kid` mismatch
- `Depends(get_current_user)` for auth-required routes; `Depends(get_current_user_optional)` for routes that read auth if present (e.g., trending feed personalization)
- 401 on missing/invalid token; 403 on insufficient permissions (covered by per-route guards in WD-17+)

**Acceptance criteria:**
1. `pytest tests/test_auth.py::test_pro_jwt_accepted` passes (uses a mock Pro JWKS + fixture token)
2. `pytest tests/test_auth.py::test_eternitas_ept_accepted` passes
3. `pytest tests/test_auth.py::test_invalid_signature_rejected` returns 401
4. `pytest tests/test_auth.py::test_expired_token_rejected` returns 401
5. JWKS cache works: second request within 5 min doesn't re-fetch JWKS (track with a counter)
6. Token discrimination: middleware tries Pro first (faster RS256 verification), falls back to Eternitas on `kid` mismatch

**Implementation hints:**
- `python-jose[cryptography]` for verification: `jwt.decode(token, key=jwks_key, algorithms=['RS256', 'ES256'])`
- Fetch the entire JWKS once, cache, look up `kid` from the token header for the right key
- Don't trust the token's `iss` claim alone — verify signature with the correct issuer's JWKS
- For ES256 (raw R||S signature per WD-7), `jose` accepts both DER and raw; ensure the test fixtures use raw
- Per AUDIT_2026-05-21.md Bucket 3: passport, clearance_level, integrity_band field names are aligned across the ecosystem

**References:** ADR-050; ADR-053 §"Endpoints (v1)" (auth-required marker); `feedback_jwks_split_brain`; `reference_eternitas_mint_ept`.

---

### WD-16: Browse + search + single-drop + trending endpoints

**Phase:** C
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-14, WD-15
**Blocks:** WD-26 (marketplace UI), WD-32 (Chat trending feed)

**Purpose:** Implement read-side endpoints for discovering drops. Browse by type/tag/lang; full-text search on name+description; single-drop detail; version history; forks list; trending feed (weighted by recency × installs × ratings × Integrity).

**Surface:**
- `routes/drops.py`:
  - `GET /api/v1/drops` — query params: `type`, `q` (text), `tag`, `lang`, `cursor`, `limit` (default 20, max 100)
  - `GET /api/v1/drops/trending` — same params + applies trending algo
  - `GET /api/v1/drops/{id}` — single drop with manifest, author, fork count, install count, rating
  - `GET /api/v1/drops/{id}/versions` — version history
  - `GET /api/v1/drops/{id}/forks` — paginated list of forks (lineage UI)
- `services/trending.py` — implements v1 algorithm: `score = installs_last_7d * 1.0 + retention_30d * 2.0 + bayesian_rating * 1.5 + fork_count * 0.5 + integrity_weight * 0.5 + tip_volume_log * 0.3`
- i18n resolution (WD-22): the `name` and `subtitle` fields are resolved per request `Accept-Language` header in the response shape (return resolved string + raw object)
- `GET /well-known/r2-config` — public, no auth: returns `{account_id, bucket, public_domain}` for the SDK (WD-8 fetches this)

**Acceptance criteria:**
1. `curl https://api.windydrops.com/api/v1/drops?type=control-panel-template&limit=5` returns paginated JSON
2. Full-text search uses Postgres `to_tsvector(name || ' ' || description)`; works with stem-tolerant queries
3. `GET /api/v1/drops/trending` returns drops sorted by computed score; no auth required
4. i18n: `GET /api/v1/drops/{id}` with `Accept-Language: ko` returns `name: "에코 HQ"` if available, fallback to `default` locale
5. Pagination cursor is stable (encoded `(score, id)` for trending; `(published_at, id)` for browse)
6. `GET /well-known/r2-config` returns `{account_id: "193b347...", bucket: "windydrops-bundles", public_domain: "drops.windydrops.com"}` without auth

**Implementation hints:**
- Use `asyncpg` row-level cursor pagination; not offset/limit
- Cache trending feed results in Redis for 5 min; recalculate hourly
- The trending formula is a starting point — tune empirically post-launch (M9 vector similarity comes later)
- For full-text: create `GIN` index on `to_tsvector('english', name || ' ' || description)` in WD-14

**References:** ADR-053 §"Endpoints (v1)" + §"Ratings, reviews, and quality signals" trending order; AUDIT_2026-05-21.md Bucket 4 (no LLM calls in registry until M9+).

---

### WD-17: User library endpoints (install / uninstall / list)

**Phase:** C
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-14, WD-15
**Blocks:** WD-31 (Control Panel queries this), WD-32 (Chat trending shows installed state)

**Purpose:** Implement the install/uninstall/list endpoints for a user's library. Install = add a row mapping `(user_id, drop_id, version, installed_at)`. Surfaces query `?type=...` to see what to load.

**Surface:**
- `routes/library.py`:
  - `GET /api/v1/me/library` (auth) — list all installed drops for the user
  - `GET /api/v1/me/library?type=control-panel-template` — filter by type
  - `POST /api/v1/me/library/install` (auth) — body: `{drop_id, version?, payment_intent_id?}`
  - `POST /api/v1/me/library/uninstall` (auth) — body: `{drop_id}`
- v1: paid drops return `402 — paid drops launching v1.1` (per ADR-053 §"Paid drops" reserved scope)
- Install resolves `depends_on` chain via `services/composition.py` (WD-23 folded in here): installs dependency drops too if not already in library
- Emits `drop.installed` / `drop.uninstalled` webhook events (WD-21)

**Acceptance criteria:**
1. `POST /api/v1/me/library/install {"drop_id": "kit-oc5-echo-hq"}` (auth) returns 201 + library row
2. `GET /api/v1/me/library` returns the installed drop
3. Re-installing the same drop returns 200 (idempotent — just updates `installed_at`?) No: returns 409 since the row exists. Use PUT for update.
4. Installing a paid drop in v1 returns 402 with body `{error: "paid_drops_v1_1"}`
5. Installing a drop with `depends_on: [theme-pack-neon]` also installs `theme-pack-neon` if not present (transitive)
6. Uninstall removes the library row and emits `drop.uninstalled` event

**Implementation hints:**
- Library = pointer list; no bundle bytes copied to user storage (per ADR-053)
- The pre-installed defaults (Echo HQ + Alpha Panel per ADR-054) get populated by a webhook from `account-server` on identity provisioning — implement the subscribe side in WD-21
- Composition resolution: recursive depth-first walk of `depends_on`; cap at depth 5 to prevent runaway chains
- `version` defaults to `current_version` if omitted

**References:** ADR-053 §"What install means in v1" + §"Library state"; ADR-054 §"Pre-installed defaults"; WD-23.

---

### WD-18: Publish endpoint + signature verification + duplicate-id guard

**Phase:** C
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-13, WD-14, WD-15
**Blocks:** v1 ship (criterion #7 — external contributor publishes)

**Purpose:** Implement the publish endpoint. Validate manifest against WD-0 schema; if signature present, verify against Eternitas JWKS; check for `id` collision; check for `(id, version)` collision; persist `drop_versions` row; emit `drop.published` webhook.

**Surface:**
- `routes/drops.py`:
  - `POST /api/v1/drops` (auth required) — body: `{manifest, bundle_url, bundle_sha256, signature?}`
- `services/signature_verify.py`:
  - `verify_eternitas_signature(manifest, bundle_sha256) -> {valid: bool, signer: dict | None, error: str | None}`
  - Recomputes `canonical_manifest_sans_signature || bundle_sha256` digest, compares signature
  - Fetches Eternitas JWKS, looks up signer's current `integrity_band` via `GET /api/v1/passports/<passport>`
- Validation: schema validation via WD-2's Pydantic model; reject 400 on invalid
- Conflict detection: `id` collision returns 409 with hint to use a different id; `(id, version)` collision returns 409 with "versions are immutable" message
- v1.1 enforcement (schema-reserved now): if `pricing.type == "paid"` and no `signature`, return 422 with "paid drops require Eternitas signing"
- Stores `signer_passport`, `signer_integrity_band` (snapshot at publish), `signature_verified: true` on the `drop_versions` row

**Acceptance criteria:**
1. Publishing a valid free unsigned manifest returns 201
2. Publishing a signed manifest with a real-format-but-fake signature returns 422 with `signature_invalid`
3. Publishing a valid signed manifest stores `signer_passport`, `signer_integrity_band` correctly
4. Publishing the same `(id, version)` twice returns 409
5. Publishing a new `version` of an existing `id` succeeds (200, not 201)
6. Publishing as user A with manifest declaring author B's passport rejects (must own the passport)
7. `paid` pricing without signature → 422 (anti-abuse pre-commit even though v1 doesn't accept paid installs)
8. Emits `drop.published` webhook to all subscribers (WD-21)

**Implementation hints:**
- Verify against the Pydantic model from `windy_drops_spec` (the WD-2 codegen output) — gives consistent validation between SDK + registry
- For the signature check: re-fetch the bundle from R2, compute SHA-256, compare to the claimed `bundle_sha256`; reject if mismatch
- Author ownership check: compare `request.state.user.passport` against `manifest.author[].passport`; allow if any author matches the caller
- Snapshot of `integrity_band` at publish time means: future revocations don't retroactively invalidate published drops (per ADR-053)

**References:** ADR-053 §"Publishing" + §"Signing + trust"; ADR-053 acceptance criterion #7.

---

### WD-19: Fork endpoint + lineage chain persistence

**Phase:** C
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-14, WD-15, WD-18 (publish creates the forked drop)
**Blocks:** v1 ship (criterion #9 — fork lineage end-to-end)

**Purpose:** When a user runs `windy-drops fork`, the SDK calls this endpoint to register the lineage server-side (before the actual `publish` of the forked drop). This lets the source's `forks` count increment immediately and supports the fork-lineage UI.

**Surface:**
- `routes/drops.py`:
  - `POST /api/v1/drops/{id}/fork` (auth) — body: `{new_id, new_name}`
- Persists a `forks` row: `(source_drop_id, fork_drop_id)`
- `drop.forked` webhook emitted
- The forked drop's `drop_versions` row is created when the user later runs `publish` (WD-18 sees `forked_from` field and links to the existing `forks` row)
- Server-side validation: `new_id` doesn't collide; source drop exists; source isn't withdrawn

**Acceptance criteria:**
1. `POST /drops/kit-oc5-echo-hq/fork {"new_id": "my-echo-hq-neon", "new_name": "Neon HQ"}` returns 201
2. `GET /drops/kit-oc5-echo-hq` returns `fork_count: 1` after the call
3. `GET /drops/kit-oc5-echo-hq/forks` returns `[{id: "my-echo-hq-neon", ...}]`
4. After `WD-10` (SDK fork) + this endpoint + later `WD-18` (publish): the forked drop's manifest has `forked_from: "kit-oc5-echo-hq"`; the original drop's card shows `Forks: 1` with link
5. Free → paid fork in v1.1 requires consent: returns 403 unless original author has approved
6. The card UI shows the lineage chain (Echo HQ → Neon HQ → Neon HQ Refined) — registry walks `forked_from` recursively

**Implementation hints:**
- The `forks` row can be created before the fork is published (proactive); WD-18 binds the actual `drop_versions` row to it when the publish lands
- Track `forks.is_published: bool` so unpublished forks can be cleaned up (cron + 7-day TTL)
- Lineage chain walk: recursive CTE in Postgres: `WITH RECURSIVE chain AS (SELECT id, forked_from FROM drops WHERE id = $1 UNION ALL SELECT d.id, d.forked_from FROM drops d JOIN chain c ON d.id = c.forked_from) SELECT * FROM chain`

**References:** ADR-053 §"Remix & fork culture"; ADR-053 acceptance criterion #9.

---

### WD-20: Rating + review endpoints + aggregations

**Phase:** C
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-14, WD-15
**Blocks:** WD-26 (marketplace UI shows ratings); part of trending score (WD-16)

**Purpose:** Authenticated users can rate drops 1-5 stars with an optional ≤1000-char review. Aggregates surface in cards + drop detail pages + trending algorithm.

**Surface:**
- `routes/ratings.py`:
  - `POST /api/v1/drops/{id}/rating` (auth) — body: `{stars: 1-5, review?: string}`
  - `GET /api/v1/drops/{id}/ratings` — aggregated + recent reviews (paginated)
- One rating per user per drop (subsequent calls update — UPSERT)
- Bayesian smoothing for aggregate score: `score = (review_count * raw_avg + min_count * prior_mean) / (review_count + min_count)` with `prior_mean = 3.5`, `min_count = 5`
- No rating gates publishing; bad-rated drops still ship, just don't trend

**Acceptance criteria:**
1. `POST /drops/echo-hq/rating {"stars": 5, "review": "Beautiful"}` returns 201
2. Second call from same user updates the existing row (PUT-like semantics)
3. `GET /drops/echo-hq/ratings` returns `{aggregate: {stars_avg, review_count, bayesian_score, histogram}}`
4. `stars: 0` or `stars: 6` returns 400
5. Review longer than 1000 chars returns 400
6. Unauthenticated rating attempts return 401

**Implementation hints:**
- Use `ON CONFLICT (user_id, drop_id) DO UPDATE` for upsert
- Histogram: `[count_1_star, count_2_star, ..., count_5_star]` — pre-computed via a materialized view refreshed hourly, or computed inline if traffic is low in v1
- Spam detection: reserved for v2 (anyone can rate); track `created_at` for future analysis

**References:** ADR-053 §"Ratings, reviews, and quality signals".

---

### WD-21: Webhook substrate (subscribe + emit + HMAC-SHA256 + retry)

**Phase:** C
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-14, WD-15
**Blocks:** WD-28 (Stripe webhook receiver uses same dispatcher), WD-32 (Chat subscribes via this)

**Purpose:** Ecosystem services subscribe to drop-lifecycle events; the registry delivers them with HMAC-SHA256 signatures matching the windy-chat pattern. Retry with exponential backoff. Dispatch is async via Redis-backed queue.

**Surface:**
- `routes/webhooks.py`:
  - `POST /api/v1/webhooks/subscribe` (auth) — body: `{event_types: [...], callback_url, secret}`
  - `DELETE /api/v1/webhooks/{subscription_id}` (auth)
  - `GET /api/v1/me/webhooks` (auth) — list user's subscriptions
- `services/webhook_dispatcher.py`:
  - Listens to internal events (Python `asyncio.Queue` populated by other services)
  - For each matching subscription, POSTs to `callback_url` with body + header `X-Windy-Drops-Signature: sha256=<hmac_hex>`
  - Retries: 1s, 2s, 4s, 8s, 16s — 5 attempts max
  - Records `webhook_deliveries`: `(subscription_id, event_id, status_code, response_body_trunc, attempted_at, succeeded_at, retry_count)`
- Event types emitted: `drop.published`, `drop.installed`, `drop.uninstalled`, `drop.forked`, `drop.rated`, `drop.tipped`
- Event payload shape: `{event_id, event_type, occurred_at, drop_id?, version?, user_id?, ...event-specific fields}`

**Acceptance criteria:**
1. Subscribe → publish a drop → POST hits subscriber URL within 5 seconds
2. The `X-Windy-Drops-Signature` header is `sha256=<hex>` of `HMAC-SHA256(secret, raw_body)`
3. If the subscriber returns 5xx, retry with backoff (verified via mock subscriber)
4. After 5 failures, mark the delivery as `failed` and emit an internal alert (admin TODO)
5. Subscriber URL validation at subscribe time: must be HTTPS in production
6. Unknown event types in `event_types` are accepted (forward-compat per Invariant 12)

**Implementation hints:**
- HMAC: `hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()` — matches `windy-chat`'s `X-Windy-Signature` and `X-Eternitas-Signature` pattern per AUDIT_2026-05-21.md Gap #3
- Use `tenacity` for retry logic
- Reserve header name `X-Windy-Drops-Timestamp` for future replay-window protection (v2); don't emit it in v1
- Background task: use FastAPI `BackgroundTasks` for fire-and-forget OR a dedicated asyncio task spawned at startup; latter is more robust
- Idempotency for subscribers: include `event_id` (UUID) — subscribers SHOULD dedupe on this

**References:** ADR-053 §"Webhook substrate"; AUDIT_2026-05-21.md Gap #3; `windy-chat/CLAUDE.md` §"Push-side Webhooks".

---

### WD-22: Postgres backup (MF4) + restore drill

**Phase:** C
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-12, WD-14
**Blocks:** —

**Purpose:** Set up nightly pg_dump → S3 backup with versioning, lifecycle (30d → 90d Glacier → expire 365d), and a tested restore drill. Per MF4 reference (eternitas pattern).

**Surface:**
- S3 bucket: `s3://windy-backups-windyregistry-prod` (SSE-S3, versioned, lifecycle as above)
- `deploy/backup/pg_backup.sh` — pg_dump | gzip | aws s3 cp
- `deploy/backup/pg_backup.service` + `pg_backup.timer` — systemd unit + timer (daily 03:06 UTC matching eternitas pattern)
- `docs/runbooks/backup-restore.md` — restore drill instructions; tested + documented
- IAM user for backups: read-only on Postgres (via pg_dump role), write-only to S3 bucket (no list/delete)

**Acceptance criteria:**
1. `systemctl start pg_backup.service` produces a `.sql.gz` in S3 named `windyregistry-<date>.sql.gz`
2. `journalctl -u pg_backup.service` shows exit 0 + uploaded size
3. Restore drill: spin up a fresh Postgres, `aws s3 cp s3://.../latest.sql.gz - | gunzip | psql` reconstructs the DB; smoke test (count drops) matches source
4. Lifecycle policy verified via `aws s3api get-bucket-lifecycle-configuration --bucket windy-backups-windyregistry-prod`
5. `docs/runbooks/backup-restore.md` includes RTO/RPO targets and tested timing

**Implementation hints:**
- Copy eternitas's backup setup: search `~/eternitas/deploy/backup/` for the reference scripts
- Use `pg_dump --format=custom` for faster restore + selective table restore
- Test restore at least once before declaring this strand done (MF4 invariant)

**References:** MF4 (Marathon Foundation #4); eternitas backup pattern from `project_marathon_foundations_program`.

---

# PHASE D — DISCOVERY SURFACES (sandbox, share URLs, profiles, marketplace UI)

Phase D ships M5 (sandbox + share URL pieces) and M8 (marketplace UI). The Petri-dish growth loop lives in this phase: sandboxed live previews, viral OpenGraph cards, author profiles, follow graph, marketplace browsing.

**Phase D ships within M5 + M8.** Estimated calendar: 5 working days.

---

### WD-23: Iframe sandbox host + postMessage protocol + mock data injection

**Phase:** D
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-13, WD-16
**Blocks:** WD-24 (sandbox URL embedded on short URLs), WD-31 (Control Panel host loader reuses sandbox pattern)

**Purpose:** Serve `/api/v1/drops/{id}/preview` as a sandboxed iframe URL. The iframe runs the drop's bundled `render.js` with mock data injected via `postMessage`. No parent-DOM access, no top-level navigation, CSP-locked. Live demos that prove the drop works before install.

**Surface:**
- `routes/drops.py`:
  - `GET /api/v1/drops/{id}/preview` — returns HTML page with `<iframe src="https://drops.windydrops.com/<id>/<version>/preview.html" sandbox="allow-scripts">` + parent-side JS that posts mock data
- `services/sandbox_host.py`:
  - Generates the preview HTML with CSP headers: `default-src 'self' drops.windydrops.com; script-src 'unsafe-inline' drops.windydrops.com; connect-src 'none'`
  - postMessage protocol: parent posts `{type: "mock-data", payload: <type-specific>}`; iframe replies `{type: "ready"}` then `{type: "rendered"}`
- Per-type mock data (loaded from `preview_mock_data` path inside the bundle if author provided, else from registry-side defaults):
  - `control-panel-template`: mock `windy.vitals.v1` + `windy.fleet.v1` payload (load from `tools/conformance/mocks/vitals.v1.json`)
  - `skill`: mock invocation context (`{user_id, prompt, context_documents}`)
  - `theme`: mock UI elements (a sample page that the theme styles)
  - `voice-pack`: mock audio sample + lipsync coords
  - `workflow`: mock trigger event
- Public, no-auth, rate-limited (50 req/min per IP) — anyone can preview

**Acceptance criteria:**
1. `curl https://api.windydrops.com/api/v1/drops/kit-oc5-echo-hq/preview` returns HTML with the iframe
2. Loading the preview in a real browser renders Echo HQ with mock vitals
3. The bundle's `render.js` cannot access `window.parent` (sandbox check)
4. The bundle's `render.js` cannot make outbound network calls (CSP `connect-src 'none'`)
5. A hostile bundle that tries `document.body.innerHTML = "<script src='evil.com'>"` cannot execute (CSP blocks)
6. Mock data is type-correct per the drop's declared `consumes:` protocols
7. ADR-053 acceptance criterion #10: parent DOM is inaccessible — verified by an automated browser test that asserts no XSS leak

**Implementation hints:**
- The iframe `src` is on `drops.windydrops.com` (separate origin from `api.windydrops.com`) for origin isolation
- `sandbox="allow-scripts"` (no `allow-same-origin`) — critical to prevent the iframe from reading parent cookies
- postMessage handler uses `event.origin === "https://drops.windydrops.com"` check
- For Playwright test (CI): spin up a hostile-bundle fixture, verify the harness's parent-window inspection sees no leakage
- `preview_mock_data` in the bundle is a path-relative-to-bundle JSON file; sandbox host fetches it via R2 and passes to iframe

**References:** ADR-053 §"Live preview & sandboxing" + §"Sandbox security model (v1)"; ADR-053 acceptance criterion #10.

---

### WD-24: Short URL `/d/{id}` + OpenGraph metadata + oEmbed

**Phase:** D
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-16, WD-23
**Blocks:** v1 ship (criterion #11 — share URL unfurls)

**Purpose:** Serve `windydrops.com/d/<id>` as a canonical short URL that unfurls cleanly in Twitter / Discord / iMessage / TikTok. Returns rich OpenGraph metadata; embeds the sandboxed preview iframe inline; has an Integrate button.

**Surface:**
- This lives in `windy-drops-site` (CF Pages site at windydrops.com), NOT in the registry
- `windy-drops-site/functions/d/[id].ts` — CF Pages Function: fetches `/api/v1/drops/{id}` from registry, returns HTML with OG meta tags + iframe + auth-gated Integrate button
- Registry side: `routes/drops.py` adds `GET /api/v1/drops/{id}/og` returning OG metadata JSON (title, description, image_url, canonical_url, embed_iframe_url) — used by the CF Pages Function
- oEmbed endpoint on registry: `GET /api/v1/drops/{id}/oembed?format=json` returning oEmbed-spec JSON for richer integrations (Notion, Slack, etc.)
- HTML response includes:
  - `<meta property="og:title">`, `<meta property="og:description">`, `<meta property="og:image">`, `<meta property="og:url">`, `<meta property="twitter:card" content="summary_large_image">`
  - Inline iframe: `<iframe src="https://api.windydrops.com/api/v1/drops/{id}/preview">`
  - Author + ratings + install count + fork count surfaced visually
  - "Integrate" CTA: links to `windydrops.com/integrate/<id>` (auth-gated; redirects to sign-in if needed)

**Acceptance criteria:**
1. `curl https://windydrops.com/d/kit-oc5-echo-hq` returns HTML with all 5 OG meta tags
2. Paste the URL into Twitter compose → preview card renders with title, description, preview image
3. Paste into Discord → rich embed appears
4. Paste into iMessage → preview card (uses OpenGraph)
5. The `og:image` is the preview.png from `drops.windydrops.com/<id>/<version>/preview.png`
6. ADR-053 acceptance criterion #11 verified

**Implementation hints:**
- `og:image` MUST be 1200×630 ideally; recommend in `authoring-guide.md` that preview.png be that size
- CF Pages Function uses `c.req.param("id")` for the route param
- Cache the OG response on CF edge for 5 min (drop info doesn't change rapidly)
- oEmbed spec: https://oembed.com/ — return JSON with `type: "rich"`, `html: "<iframe ...>"`, `width: 600`, `height: 400`
- Inline iframe has CSP restrictions matching WD-23

**References:** ADR-053 §"Share URLs & OpenGraph"; ADR-053 acceptance criterion #11.

---

### WD-25: Author profiles + follow graph + notifications

**Phase:** D
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-14, WD-15, WD-16
**Blocks:** WD-26 (marketplace UI shows author profiles)

**Purpose:** Every author has a public profile at `windydrops.com/@<handle>`. Shows their drops, follower count, lifetime tips, Eternitas integrity band (if signed), join date. Users follow authors to weight their drops higher in trending. Notifications on new drops from followed authors.

**Surface:**
- `routes/authors.py`:
  - `GET /api/v1/authors/{handle}` — public profile
  - `GET /api/v1/authors/{handle}/drops` — drops by this author, paginated
  - `GET /api/v1/authors/{handle}/forks` — drops forked from this author's
- `routes/follows.py`:
  - `POST /api/v1/me/follows` (auth) — body: `{author_handle}`
  - `DELETE /api/v1/me/follows/{handle}` (auth)
  - `GET /api/v1/me/follows` (auth) — list
- `models/author.py`: derives `handle` from passport (e.g., `ET26-OCKM-Y005` → `@kit-oc5`); maps to display name from Eternitas profile lookup
- `models/follow.py`: `(follower_user_id, followed_handle, created_at)`
- Trending personalization: when fetching `/trending` with auth, boost drops from followed authors by 50%
- Notifications: emit `author.new_drop` webhook event when a followed author publishes (subscribers: future user-notification service, mobile push)

**Acceptance criteria:**
1. `GET /api/v1/authors/kit-oc5` returns `{handle, display_name, integrity_band, drop_count, follower_count, joined_at, lifetime_tips_cents}`
2. `POST /api/v1/me/follows {"author_handle": "kit-oc5"}` returns 201
3. `GET /api/v1/me/follows` lists `kit-oc5`
4. `GET /api/v1/drops/trending` (auth as a user following kit-oc5) ranks kit-oc5's drops higher than the same query without auth
5. Unfollowing decrements `follower_count` correctly
6. Authors can opt out of `lifetime_tips_cents` display (per `monetization.public_tips_disabled: true` on their profile)

**Implementation hints:**
- `handle` derivation: use `author[0].callsign` if present, else derive from passport (e.g., `kit-oc5` from `ET26-OCKM-Y005` — keep simple deterministic mapping; document in `authors-handles.md`)
- Eternitas integrity_band: refresh nightly via `GET https://api.eternitas.ai/api/v1/passports/<passport>` (NOT per-request — too expensive)
- Follow graph as a simple table; defer follower fanout-on-write to v2 (just count via `SELECT COUNT(*)` for now; cache in Redis)

**References:** ADR-053 §"Author profiles & social graph"; AUDIT_2026-05-21.md Bucket 3 (Eternitas field alignment).

---

### WD-26: Marketplace UI (windy-drops-site browse + search + author pages + fork lineage)

**Phase:** D
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-16, WD-19, WD-23, WD-24, WD-25
**Blocks:** —

**Purpose:** Build the consumer-facing marketplace at windydrops.com. Browse + search + filter; per-drop pages with preview iframe + ratings + reviews; author profile pages; fork lineage UI; the "Integrate" flow.

**Surface:**
- `windy-drops-site` (existing CF Pages repo) — Vite+React migration from current vanilla HTML
- Pages:
  - `/` — landing + featured drops carousel
  - `/browse` — paginated grid with filter sidebar (type, tag, lang, sort: trending / new / top-rated)
  - `/search?q=...` — full-text results
  - `/d/<id>` — drop detail page (WD-24's CF Pages Function returns this for unfurls; the SPA route renders the same page for in-browser users)
  - `/@<handle>` — author profile
  - `/me/library` — user's library (auth)
  - `/me/payouts` — creator payout dashboard (auth; placeholder until WD-27)
- Auth: Pro account-server OAuth flow (per existing windy-pro pattern); JWT stored in cookie + Authorization header for API calls
- Component library: ad-hoc Tailwind; no design system in v1 (deferred to post-launch)

**Acceptance criteria:**
1. Browse page paginates correctly; filters work
2. Search returns relevant results (delegates to registry `?q=`)
3. Drop detail page renders preview iframe (WD-23) and Integrate button
4. Integrate button works end-to-end: prompts auth if needed, calls `POST /me/library/install`, shows confirmation
5. Author profile page shows drops + follow/unfollow + lifetime tips
6. Fork lineage UI on drop detail: shows "Forked from @author" link + "Forks: N" expandable list
7. Page Lighthouse score ≥ 90 for performance + accessibility

**Implementation hints:**
- Migrate windy-drops-site from vanilla HTML to Vite+React; preserve the existing landing page content
- Deploy: `wrangler pages deploy dist` (per `feedback_wrangler_pages_deploy_dir` — deploy `dist`, NEVER `.`)
- CF Pages Functions handle SSR for OG unfurls on `/d/<id>` routes
- Cache API responses with `stale-while-revalidate` for snappiness

**References:** ADR-053 §"Marketplace UI (M8)"; `feedback_wrangler_pages_deploy_dir`.

---

# PHASE E — MONETIZATION (Stripe Connect — v1 tips, v1.1 paid drops)

Phase E ships M5.5 (tips) for v1. Strands WD-29 and WD-30 are reserved for v1.1 (6-8 weeks after v1 ship) — schema fields are already populated in WD-0 and WD-14.

**Phase E v1 (tips) ships within M5.5.** Estimated calendar: 3 working days.

---

### WD-27: Stripe Connect Express OAuth + creator payout dashboard data

**Phase:** E
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-14, WD-15
**Blocks:** WD-28, WD-29 (v1.1)

**Purpose:** Authors connect Stripe Connect Express via OAuth so tips and (v1.1) paid drop revenue flow directly to them. Stripe handles KYC, tax forms, bank linkage. Registry stores `stripe_account_id` on author profile.

**Surface:**
- `routes/stripe_connect.py`:
  - `POST /api/v1/me/stripe/connect` (auth) — initiates Stripe Connect Express OAuth; returns redirect URL
  - `GET /api/v1/me/stripe/callback` — OAuth callback; exchanges code for `stripe_user_id`; stores on author
  - `GET /api/v1/me/stripe/status` (auth) — returns `{connected: bool, account_id?, charges_enabled?, payouts_enabled?}`
- `models/author.py` extended with `stripe_account_id`, `stripe_payouts_enabled`, `stripe_connected_at`
- `services/stripe_client.py` — wraps stripe SDK; secret from lockbox via env
- Webhook endpoint: `POST /api/v1/webhooks/stripe` (WD-28 implements but registers in same router)

**Acceptance criteria:**
1. `POST /api/v1/me/stripe/connect` returns a Stripe Connect Express OAuth URL
2. Following the URL + completing Stripe onboarding lands at `/api/v1/me/stripe/callback?code=...&state=...`
3. The callback exchanges the code, stores `stripe_account_id`, redirects to `windydrops.com/@me/payouts`
4. `GET /api/v1/me/stripe/status` returns connected: true after successful onboarding
5. Author profile (WD-25) shows "Connected to Stripe" badge if applicable
6. Stripe secret loaded from `STRIPE_SECRET_KEY` env (lockbox-sourced); never logged

**Implementation hints:**
- Stripe Connect Express docs: https://stripe.com/docs/connect/express-accounts
- OAuth `state` parameter: signed JWT with user_id + 10-min TTL to prevent CSRF
- Token in lockbox per turnover: `~/kit-army-config/ACCESS_LOCKBOX.md` (don't fetch before this strand starts)
- `pricing.type == "subscription"` is NOT supported in v1 or v1.1 — schema reserves it; reject at WD-18 with 422

**References:** ADR-053 §"Monetization v1 (tip jars)" + §"Creator-economy policy table"; lockbox.

---

### WD-28: Tip checkout + Stripe webhook receiver

**Phase:** E
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-27, WD-21
**Blocks:** v1 ship (acceptance criterion #5 — creator receives a real $1 tip)

**Purpose:** Users on drop pages can tip authors via Stripe Checkout. 0% platform cut. Webhook from Stripe confirms success, records tip, updates lifetime tips on author profile.

**Surface:**
- `routes/tips.py`:
  - `POST /api/v1/drops/{id}/tip` (auth) — body: `{amount_cents, currency}` — creates Stripe Checkout Session with `destination_charge` to the author's `stripe_account_id`; returns Checkout URL
- `routes/webhooks.py` (Stripe-side):
  - `POST /api/v1/webhooks/stripe` — verifies signature with `STRIPE_WEBHOOK_SECRET`; handles `checkout.session.completed` events; records `tips` row; emits internal `drop.tipped` event (dispatched via WD-21)
- `models/tip.py`: `(drop_id, user_id, author_passport, amount_cents, currency, stripe_session_id, status, created_at)`
- `monetization.tips_enabled: false` on a drop → `POST /tip` returns 400
- 0% platform fee — entire amount (minus Stripe ~3% processing) goes to creator
- Marketplace UI (WD-26) shows tip button on drop pages when `monetization.tips_enabled` is true

**Acceptance criteria:**
1. `POST /drops/echo-hq/tip {"amount_cents": 500, "currency": "usd"}` returns a Stripe Checkout URL
2. Completing the checkout (in test mode) fires the webhook; `tips` row inserted with `status: succeeded`
3. Author's `lifetime_tips_cents` increments
4. Stripe webhook signature verification fails → 400 (security)
5. ADR-053 acceptance criterion #5: a creator signs in, connects Stripe (WD-27), receives a real $1 tip, sees the payout in Stripe dashboard
6. `drop.tipped` webhook event dispatched (WD-21) to subscribers

**Implementation hints:**
- Stripe Checkout: `stripe.checkout.Session.create(payment_intent_data={transfer_data={destination: <stripe_account_id>}, application_fee_amount: 0}, ...)`
- application_fee_amount: 0 makes 0% platform cut explicit
- Webhook signature verification: `stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)`
- Tip amounts: enforce minimum $1 (100 cents) to avoid silly tips; maximum $500 in v1 (anti-abuse)

**References:** ADR-053 §"Tip flow" + §"What ships in v1"; ADR-053 acceptance criterion #5.

---

### WD-29 (reserved-v1.1): Paid install flow + Stripe payment-intent verification

**Phase:** E
**Status:** reserved-v1.1
**Owner:** <unassigned>
**Depends on:** WD-17, WD-27, WD-28
**Blocks:** WD-30 (royalty splits assume paid sales)

**Purpose:** v1.1 only. Implement the paid install flow per ADR-053 §"Paid drops & royalty model." First paid drop per author requires Eternitas band ≥ fair + manual review. Stripe payment_intent before library row insert. Auto-suspend if refund rate > 20% in first 30 days.

**Surface (sketched; full design at v1.1 ADR):**
- `routes/library.py` updated: `POST /me/library/install` accepts `payment_intent_id`; verifies payment with Stripe; inserts library row; records `purchases` row
- `routes/purchases.py`:
  - `GET /api/v1/me/purchases`
  - `POST /api/v1/me/purchases/{id}/refund` (within window)
- Anti-abuse: first-paid-per-author manual review queue (admin dashboard); 1 new paid drop / author / 24h rate limit; auto-suspend on >20% refund rate

**Acceptance criteria:** (defer to v1.1 detailed spec)

**Implementation hints:** Eternitas signing required (WD-18 enforces); rate-limit via Redis; refund auto-removes drop from library.

**References:** ADR-053 §"Paid drops & royalty model (RESERVED for v1.1)" + §"Creator-economy policy table".

---

### WD-30 (reserved-v1.1): Royalty split payouts on paid forks + refund flow

**Phase:** E
**Status:** reserved-v1.1
**Owner:** <unassigned>
**Depends on:** WD-29
**Blocks:** —

**Purpose:** v1.1. When a fork of a paid drop sells, Stripe Connect splits revenue per the fork's `royalty.fork_revenue_share_pct` (default 50%). Original author + fork author both paid instantly via Stripe's destination_charge with two destinations.

**Surface (sketched):**
- `services/royalty.py` — computes split amounts; uses Stripe `transfer_data` with multiple destinations (or sequential transfers)
- Refund flow: user-initiated; Stripe issues refund; drop removed from library; creator notified

**Acceptance criteria:** (defer to v1.1)

**Implementation hints:** Stripe doesn't natively support 3-way splits in one Checkout; use two `transfer.create` calls after the charge. Default 50% to original; creator-overridable 10-100%.

**References:** ADR-053 §"Royalty payout on paid forks" + §"Refund flow".

---

# PHASE F — CONSUMER SURFACES + FEDERATION

Phase F wires up the first consumer surfaces (Control Panel per ADR-054, Chat trending tab) and sketches federation contracts. AI-assisted authoring (M11) is reserved for v1.1.

**Phase F ships M6 + M7 + M9 + M11.** Estimated calendar: 8 working days total (M6 = 7d per ADR-054, M7 = 2d, M9 = 1d, M11 = 2d).

---

### WD-31: windy-control-panel repo bootstrap + Vitals/Fleet protocols + SDK host loader (full ADR-054)

**Phase:** F
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-1 (TS bindings for manifest typing), WD-8 (publish official drops via SDK), WD-17 (library lookup)
**Blocks:** ADR-054 acceptance criteria

**Purpose:** Create the windy-control-panel repo. Implement Vitals + Fleet protocols as a TypeScript package. Port the IPC bridge from `~/wp-echohq` worktree. Add account-server `/api/v1/vitals` + `/api/v1/me/fleet` endpoints. Port Echo HQ + Alpha Panel as drops. Build the Web SPA + Electron host loaders. Polish for grandma demo.

This strand is shorthand for **ADR-054 milestones M-A through M-H** combined into one strand because they're tightly coupled. May split into sub-strands during implementation.

**Surface:**
- New repo: `sneakyfree/windy-control-panel` (private at first; can flip public)
- `packages/protocols/` — `@windy/control-panel-protocols`: TS types + JSON Schema for Vitals v1 + Fleet v1 (per ADR-054 specs)
- `packages/host-web/` — React loader + sandbox wrapper for the Web SPA
- `packages/host-electron/` — Electron preload that exposes `windyAPI.systemInfo()` + IPC bridge code ported from `~/wp-echohq/`
- `packages/official-drops/echo-hq/` + `alpha-panel/` — Echo HQ + Alpha Panel as `control-panel-template` drops with full SKILL.md + render.js + styles.css + preview.png
- `packages/sdk-extension/` — extends `@windy/drops-sdk` `new --type control-panel-template` scaffolding
- account-server (in `windy-pro`): `GET /api/v1/vitals` (rename + schema-tag existing) + `GET /api/v1/me/fleet` (new, reads from `product_accounts` per ADR-050)
- windy-pro Web SPA route `/control-panel`: consumes drops via SDK loader, renders selected drop
- windy-pro Electron `renderer/control-panel.html`: same SDK loader
- ecosystem-nav.js gets new entry `🖥️ Control Panel`
- Pre-installed defaults (Echo HQ + Alpha Panel) registered in windy-registry via webhook from account-server on identity provisioning (WD-17 dependency)

**Acceptance criteria:**
1. `npm install @windy/drops-sdk @windy/control-panel-protocols` in a fresh project + import works
2. Echo HQ drop published to windy-registry via `windy-drops publish` → installed in a test user's library → renders in both Web SPA and Electron with real Vitals + Fleet data
3. New user hatches agent → clicks Control Panel tile → sees Echo HQ pre-selected with their machine data + (empty or populated) fleet panel
4. ADR-054 criterion #6: adding Bravo Panel (Kit OC2's template) is a `windy-drops publish` from any external machine — zero windy-pro code changes between publish and render
5. Sandbox isolation holds: Echo HQ's render.js cannot escape the iframe (verified per WD-23 pattern; ADR-053 criterion #10)
6. `~/wp-echohq` worktree's React Echo HQ is fully superseded; the React imports in windy-pro are removed; replaced by SDK loader

**Implementation hints:**
- The `~/wp-echohq` worktree has the IPC bridge logic already working — copy it to `packages/host-electron/src/preload.ts`; don't push or rebase the worktree's branch (per turnover note)
- Fleet endpoint reads `product_accounts` where `product = 'windy_fly'` AND `operator_identity_id = <user>` (per ADR-050 Category 3)
- For tier-1 free users: `agents = []`; panel shows just `this_machine`
- Client patches `this_machine.can_self_report` + `vitals_url` based on its own environment (Electron sets `ipc://system-info`; Web sets `internal`)
- Pre-installed defaults: a webhook from account-server fires on identity provisioning; the registry inserts library rows for Echo HQ + Alpha Panel (per ADR-054)

**References:** ADR-054 (full); ADR-053 §"What install means in v1" + §"Library state"; turnover §"Pitfalls" #2 (wp-echohq stale).

---

### WD-32: Windy Chat trending feed subscriber + Drops tab UI

**Phase:** F
**Status:** locked
**Owner:** <unassigned>
**Depends on:** WD-16, WD-21 (subscribes via webhook substrate)
**Blocks:** —

**Purpose:** Windy Chat gains a "Drops" tab that surfaces trending drops + drops from followed authors + Integrate buttons inline. Subscribes to `drop.published` + `drop.tipped` + `drop.forked` webhooks to push real-time updates to chat users.

**Surface:**
- `windy-chat` repo modifications:
  - New service or extension to existing push-gateway that subscribes to Drops webhooks via `POST /api/v1/webhooks/subscribe`
  - Chat client (in `windy-pro` desktop + `windy-pro-mobile`) gets a new "Drops" tab that calls `GET /api/v1/drops/trending` + renders cards
  - Integrate button in chat → calls `POST /me/library/install`
  - Inline drop card unfurls when a user shares a `windydrops.com/d/<id>` URL in chat (uses OG metadata from WD-24)

**Acceptance criteria:**
1. Chat user opens Drops tab → sees trending drops from windy-registry
2. New drop published → appears in Drops tab within 5 seconds (via webhook → push-gateway → client)
3. Sharing a `windydrops.com/d/<id>` URL in a chat room → it unfurls into a rich card with preview + Integrate button
4. Tap Integrate → drop installed; success toast
5. Drops from followed authors (per WD-25) appear higher in the feed (auth-aware trending)

**Implementation hints:**
- Chat subscribes to drops webhooks via `POST https://api.windydrops.com/api/v1/webhooks/subscribe` with chat's HMAC secret
- The Drops tab is client-side; doesn't require Synapse changes
- URL unfurl: chat already does OG fetch for links; reuse that mechanism

**References:** ADR-053 §"M7 Chat trending feed"; AUDIT_2026-05-21.md Bucket 2 (webhook alignment).

---

### WD-33 (reserved-v1.1): AI-assisted authoring (`windy-drops new --ai`) via Windy Mind

**Phase:** F
**Status:** reserved-v1.1
**Owner:** <unassigned>
**Depends on:** WD-4 (SDK foundation), Windy Mind running (already in production)
**Blocks:** —

**Purpose:** v1.1. `windy-drops new --ai "a cyberpunk vitals dashboard with a pulsing heartbeat"` calls Windy Mind, which generates SKILL.md + render.js + styles.css. Author reviews + publishes. Web-based variant at `windydrops.com/new` (M10 + M11 from ADR-053).

**Surface (sketched):**
- TS + Py SDK: `commands/new.{ts,py}` gains `--ai <description>` flag
- Calls `POST https://api.windymind.ai/v1/chat/completions` with a structured prompt
- Parses response (`choices[0].message.content`) for code blocks + frontmatter
- Writes scaffold; opens it for review

**Acceptance criteria:** (defer to v1.1)

**Implementation hints:**
- Use `MIND_API_URL` env (defaults to `https://api.windymind.ai`) + `ETERNITAS_PASSPORT_TOKEN` (or scoped key from `~/.windy/credentials.json`) — per BYOM pattern in `feedback_windy_agent_coordination` and `project_windy_mind_buffet`
- Response shape: `choices[0].message.content` (OpenAI-compat)
- Use the user's local Mind credential; never hard-code keys
- BYOM-compliant from day 1 (Invariant 8): no direct Anthropic/OpenAI SDK imports

**References:** ADR-053 §"AI-assisted authoring" + §"AI integration roadmap"; ADR-022; AUDIT_2026-05-21.md Bucket 4.

---

### WD-34: Federation contract sketch (peer registry endpoints + cross-registry manifest fetch)

**Phase:** F
**Status:** locked (v1 contract sketch, not full implementation)
**Owner:** <unassigned>
**Depends on:** WD-15, WD-18
**Blocks:** —

**Purpose:** Sketch the federation endpoints so v1 doesn't preclude future federation. v1 doesn't ship federation features; it ships the CONTRACT (endpoints + behavior) that future versions can implement against.

**Surface:**
- `routes/federation.py`:
  - `GET /api/v1/federation/peers` — list registered federation peer registries (returns empty in v1)
  - `GET /api/v1/federation/drops/{peer}/{id}` — fetch a manifest from a peer registry (returns 501 not-implemented in v1)
- Docs: `docs/federation-spec.md` in windy-registry — defines peer registration, trust model (Eternitas-signed drops are portable across any Eternitas-trusting registry), namespacing rules (drop `id` is globally unique)
- Acceptance criterion #9 from ADR-053 (federation demo): at least one external ecosystem accepts a Drops manifest; can be a simple curl-based smoke test (e.g., an OpenClaw user's local script fetches + parses a drop manifest, validates signature against Eternitas JWKS, "installs" by writing to a local directory)

**Acceptance criteria:**
1. `GET /api/v1/federation/peers` returns 200 with `[]`
2. `GET /api/v1/federation/drops/example.com/foo` returns 501 with `{error: "federation_not_implemented_v1"}`
3. `docs/federation-spec.md` exists and documents the v2 contract
4. A demo script outside the Windy ecosystem can: fetch `/api/v1/drops/{id}`, verify the Eternitas signature against `api.eternitas.ai/.well-known/eternitas-keys`, parse the manifest, install locally (write to `~/.example-ecosystem/library/`)

**Implementation hints:**
- Don't implement actual federation in v1 — the contract sketch is sufficient
- Reserve table `federation_peers` in WD-14 but leave it empty
- The demo script is documentation, not production code; can be a 50-line Python file in `docs/federation-demo.py`

**References:** ADR-053 §"Federation" + acceptance criterion #9.

---

## ACCEPTANCE CRITERIA (substrate-wide; mirrors ADR-053)

The DNA strand plan is complete when ALL of the following falsifiable tests pass. These are the v1 ship gates; ADR-053 §"Acceptance criteria" is the source. Failing any one of these means the substrate isn't v1-ready.

1. ✅ Grant signs off on the SKILL.md + YAML frontmatter format (covered by WD-0).
2. ✅ M2 (WD-0 through WD-3): canonical JSON Schema + TS + Python bindings, generated from same schema.
3. ✅ M3a + M3b (WD-4 through WD-11): both SDKs publish drops; **byte-identical R2 bundles** (WD-11 conformance harness).
4. ✅ M4-M5 (WD-12 through WD-26): registry MVP serves browse + install + library + fork + rating endpoints; sandboxed live previews work; share URLs unfurl.
5. ✅ **M5.5 (WD-27 + WD-28)**: a creator can sign in, connect Stripe Connect Express, receive a real $1 tip on their drop, see payout in their Stripe dashboard.
6. ✅ M6 (WD-31): Control Panel consumes drops via the SDK loader.
7. ✅ **External contributor publish → install → render**, with zero windy-pro code changes. (The Styrofoam test. Critical.)
8. ✅ **TS-published drop and Python-published drop are indistinguishable to the registry** (WD-11).
9. ✅ **Fork lineage works end-to-end** (WD-10 + WD-19): user forks, publishes, original card shows `Forks: 1` with link to fork; fork card credits original author.
10. ✅ **Sandbox preview works**: `windydrops.com/d/<id>` renders interactive iframe with mock data, no parent-DOM leak (WD-23).
11. ✅ **Share URL unfurls**: paste `https://windydrops.com/d/<id>` into Twitter/Discord/iMessage produces a rich card with preview + Integrate CTA (WD-24).

**If criterion #7 fails**, the substrate is Styrofoam and we redesign.
**If criterion #8 fails**, the protocol has leaked into the SDK layer; no SDK v1.0.0 ships until fixed.
**If criterion #9 fails**, fork lineage is broken; remix culture can't take root.
**If criterion #10 fails**, sandbox isn't isolating; v1 launch holds.
**If criterion #11 fails**, share virality is broken; fix OG metadata before declaring v1.

---

## MILESTONE-TO-STRAND MAP

| Milestone (ADR-053) | Strands | Estimate |
|---|---|---|
| M0 — repos bootstrapped, domain wired | — (done 2026-05-21) | — |
| M1 — ADRs accepted | — (done as Proposed) | — |
| M2 — JSON Schema + TS + Python bindings | WD-0, WD-1, WD-2, WD-3 | 1.5d |
| M3a — TypeScript SDK | WD-4, WD-5, WD-6, WD-7, WD-8, WD-9, WD-10 (TS side) | 1.5d |
| M3b — Python SDK + byte-identity test | WD-4, WD-5, WD-6, WD-7, WD-8, WD-9, WD-10 (Py side), WD-11 | 1.5d |
| M4 — Registry bootstrap | WD-12, WD-13, WD-14, WD-15, WD-22 | 1d (+ backup) |
| M5 — Registry MVP | WD-16, WD-17, WD-18, WD-19, WD-20, WD-21, WD-23, WD-24, WD-25 | 4d |
| M5.5 — Monetization v1 (tips) | WD-27, WD-28 | 3d |
| M6 — Control Panel rides on Drops | WD-31 (full ADR-054 scope) | 7d (ADR-054) |
| M7 — Chat trending feed | WD-32 | 2d |
| M8 — Marketplace UI | WD-26 | 4d |
| M9 — Federation contract sketch | WD-34 | 1d |
| M10 — Web authoring editor | (folded into WD-26 future) | 4d |
| M11 — AI-assisted authoring | WD-33 (v1.1) | 2d |
| M12 — Paid drops launch (v1.1) | WD-29, WD-30 | 5d |

**Total v1 substrate-ready (M2-M9): ~22 working days** (parallelizable to ~12 calendar days with multiple ribosomes).
**Total v1.1 paid-drops-ready (M11 + M12): ~7 additional days, lands 6-8 weeks after v1 ship.**

---

## STRAND STATUS LEGEND

| Status | Meaning |
|---|---|
| `locked` | v1 scope; specification stable; ready to implement |
| `reserved-v1.1` | Schema fields and contracts reserved in v1; full implementation in v1.1 |
| `in-progress` | A contributor has claimed it and started work |
| `done` | Acceptance criteria pass; merged + deployed |

All v1 strands start as `locked`. A contributor changes status to `in-progress` when claiming, then `done` when shipped.

---

## HOW A CONTRIBUTOR USES THIS PLAN

1. **Pick a strand from the dependency graph** that has no `Depends on` unmet (or whose dependencies are `done`).
2. **Read the strand's `Surface` + `Acceptance criteria` + `Implementation hints` + `References`.** This is the contract.
3. **Open a feature branch** in the relevant repo: `feature/wd-N-<short-description>`.
4. **Implement** to the acceptance criteria — no more, no less. If you discover the spec is wrong, surface the gap to Grant; don't rewrite silently.
5. **Run the strand's acceptance tests**. All must pass.
6. **Open a PR** referencing the strand: `feat: WD-N <name> — implements DNA_STRAND_MASTER_PLAN.md`.
7. **Update strand status to `done`** in this file (single-line edit) as part of the PR.
8. **Move to the next strand** whose dependencies are now unblocked.

Multiple contributors can claim strands in parallel as long as dependency edges are respected. The dependency graph at the top is the gating contract.

---

## SIGN-OFF

**Locked when:** Grant approves this plan for v1 ship.

**Companion documents:**
- `docs/AUDIT_2026-05-21.md` — pre-strand integration audit (3 ⚠️ gaps, 0 🚨 conflicts; folded into strands above)
- `docs/MILESTONES.md` — short-form milestone tracker (mirrors WD-N status)
- `~/kit-army-config/docs/adr-053-windy-drops-substrate-v1.md` — substrate ADR
- `~/kit-army-config/docs/adr-054-control-panel-substrate-v1.md` — Control Panel surface ADR
- `~/windy-connect/docs/bundle-spec-v1.md` — sibling spec (credentials bundle)

— Grant Whitmer + Claude Opus 4.7 (1M context), 2026-05-21
