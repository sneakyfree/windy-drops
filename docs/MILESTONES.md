# Windy Drops — Milestones

Tracking the substrate buildout, in order.

## M0 — Foundation bootstrapped (2026-05-21) ✅
- Repos created: `sneakyfree/windy-drops`, `sneakyfree/windy-drops-site`
- Domains: `windydrops.com` (primary), `windydrop.com` (redirect insurance)
- License: MIT
- Repo scaffolding: README, CONTRIBUTING, CODE_OF_CONDUCT, workspace package.json

## M1 — Spec ADRs accepted
- ADR-053: Windy Drops Substrate v1 (artifact format, registry contract, install API)
- ADR-054: Control Panel Substrate v1 (Vitals + Fleet protocols, surface integration)

## M2 — Artifact spec package
- `@windy/drops-artifact-spec` — TypeScript types + JSON Schema for manifest v1
- Type-specific schemas: control-panel-template, skill, tool, theme, voice-pack, workflow
- Schema validators (Zod)

## M3 — SDK package
- `@windy/drops-sdk` — author helpers: build, verify, sign (Eternitas), publish
- `windy publish` CLI surface
- Starter scaffold in `examples/starter-control-panel-template/`

## M4 — Registry service (separate repo)
- `sneakyfree/windy-registry` — FastAPI service
- Endpoints: search, trending, install, library, publish
- R2 integration for bundle storage
- Postgres for metadata + social signals

## M5 — First surface (Control Panel)
- `sneakyfree/windy-control-panel` consumes the spec
- Echo HQ + Alpha Panel ported to drop bundles
- Web SPA + Electron host code

## M6 — Marketplace UI
- Browse view at windydrops.com
- Trending feed surfaced in Windy Chat

## M7 — Federation
- Other ecosystems can issue + consume drops
- Eternitas-signed authors get trust signals across federated registries

---

Milestone deltas land here as PRs to this file. Each M-completion gets a dated checkmark and a one-line note.
