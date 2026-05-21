# Contributing to Windy Drops

Thanks for being here. Windy Drops is a community-first project — the whole point is that anyone can publish a drop and have it land in users' hands without going through us.

## Two ways to contribute

### 1. Publish a drop (most common)

You do NOT need to PR this repo. You build a drop using the SDK, run `windy publish`, and it's live in the registry. The repo here is the *spec* and *SDK* — not the catalog. Most contributors will never touch this repo.

See `docs/authoring-guide.md` (coming soon) for the full author flow.

### 2. Improve the substrate (rarer)

If you're proposing changes to the artifact spec, the SDK, or the surface protocols, that goes through PRs here. A few principles:

- **Spec changes follow ADR review.** Any change to the manifest schema, the install contract, or the registry shape requires an accompanying ADR draft in `sneakyfree/kit-army-config/docs/`. Discuss first; PR second.
- **Backward compatibility is non-negotiable.** v1 drops must keep working forever. Additions = `v1.1` (additive minor); breaking changes = `v2` shipped in parallel.
- **The grandma test.** Every UX-touching change must make sense to a non-technical user. We will reject PRs that optimize for developer ergonomics at the cost of normie clarity.
- **No styrofoam.** This is a marathon, not a sprint. Foundation pieces get extra scrutiny.

## Code of Conduct

See `CODE_OF_CONDUCT.md`. tl;dr: be kind, be patient, build cool things, make the ecosystem better.

## Pull requests

- Small, focused PRs land faster than big ones.
- Include tests for spec changes; include type definitions for SDK changes.
- Update relevant docs in the same PR.
- Reference the ADR (if any) in the PR description.

## Questions

Open a Discussion on the repo or join the conversation in Windy Chat (room TBD).
