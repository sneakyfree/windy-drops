# Windy Drops — Milestones

Tracking the substrate buildout, in order.

## M0 — Foundation bootstrapped (2026-05-21) ✅
- Repos created: `sneakyfree/windy-drops`, `sneakyfree/windy-drops-site`
- Domains: `windydrops.com` (primary), `windydrop.com` (redirect insurance)
- License: MIT
- Repo scaffolding: README, CONTRIBUTING, CODE_OF_CONDUCT, workspace package.json

## M1 — Spec ADRs Proposed (2026-05-21) ✅ pending acceptance
- [ADR-053: Windy Drops Substrate v1](https://github.com/sneakyfree/kit-army-config/blob/main/docs/adr-053-windy-drops-substrate-v1.md) — artifact format, registry, install API, monetization, forking, sandbox, share URLs, AI agent authorship
- [ADR-054: Control Panel Substrate v1](https://github.com/sneakyfree/kit-army-config/blob/main/docs/adr-054-control-panel-substrate-v1.md) — Vitals + Fleet protocols, first surface

## M2 — Canonical schema + dual-language bindings (~1.5 days)
- `schemas/windy.drop.v1.json` — JSON Schema source of truth
- `@windy/drops-artifact-spec` (npm) — TS bindings codegen from JSON Schema
- `windy_drops_spec` (PyPI) — Python bindings (Pydantic v2) codegen from same source
- Type-specific schemas: `control-panel-template`, `skill`, `tool`, `theme`, `voice-pack`, `workflow`

## M3a — TypeScript SDK (~1.5 days)
- `@windy/drops-sdk` (npm) — `windy-drops` CLI: `new`, `validate`, `sign`, `bundle`, `publish`, `withdraw`, `fork`
- Starter scaffold in `examples/starter-control-panel-template/`

## M3b — Python SDK (~1.5 days)
- `windy-drops` (PyPI) — identical CLI surface; identical bundle output
- Conformance test: byte-identical R2 bundle compared with M3a output

## M4 — windy-registry repo bootstrapped (~1 day)
- `sneakyfree/windy-registry` — FastAPI + Postgres + asyncpg + Alembic
- R2 integration for bundle storage
- Eternitas JWKS verification

## M5 — Registry MVP (~4 days)
- Endpoints: `/drops`, `/drops/{id}`, `/me/library`, `install`, `publish`, `/fork`, `/rating`
- `/d/<id>` short URL + OpenGraph unfurl metadata
- **Iframe sandbox for live previews** (pulled from v2 into v1)
- Webhook substrate (publish/install/fork/rated/tipped events)

## M5.5 — Monetization v1 — tip jars (~3 days)
- Stripe Connect Express OAuth flow for creators
- Tip Checkout integration + webhook receiver
- Creator payout dashboard at `windydrops.com/@me/payouts`
- 0% platform cut; full pass-through (minus Stripe's ~3% processing)

## M6 — First surface: Control Panel — see ADR-054 (~7 days)
- `sneakyfree/windy-control-panel` consumes the spec
- Echo HQ + Alpha Panel ported to drop bundles
- Web SPA + Electron host code

## M7 — Windy Chat trending feed (~2 days)
- Subscribes to webhook events
- Trending tab surfaces drops inline with Integrate buttons

## M8 — Marketplace UI at windydrops.com (~4 days)
- Browse + search + filter
- Author profiles at `windydrops.com/@<handle>`
- Fork lineage visualization
- Rating UI

## M9 — Federation contract (~1 day)
- Other ecosystems can issue + consume drops
- Eternitas-signed authors get trust signals across federated registries

---

## v1.1 milestones (post-launch)

## M10 — Web-based authoring editor (~4 days)
- `windydrops.com/new` — visual SKILL.md form + Monaco code editor + live preview
- Target audience: visual creators, non-CLI users

## M11 — AI-assisted authoring (~2 days)
- `windy-drops new --ai "<description>"` scaffolds via Windy Mind
- Generates SKILL.md + render.js + styles.css from natural language
- Target audience: grandmas, total non-coders

## M12 — Paid drops launch (~5 days)
- Install API price gate (returns 402 in v1, succeeds in v1.1 with payment_intent_id)
- Stripe payment flow + refund flow
- Royalty payouts on paid forks (default 50% to original author)
- Anti-abuse: Eternitas signing required, manual review for first paid drop, 20% refund-rate auto-suspend

---

## v2+ (sketched, not committed)

- Subscriptions (recurring billing)
- Mobile authoring
- Sigstore / alternative signing
- Federation v2 (cross-registry install with Eternitas portability)
- Per-country / per-language curated discovery
- Editorial / community-elected curators
- Drop composition graphs ("works well with…")

---

Milestone deltas land here as PRs to this file. Each M-completion gets a dated checkmark and a one-line note.
