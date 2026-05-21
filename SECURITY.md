# Security policy

## Reporting a vulnerability

If you discover a security issue in the Windy Drops substrate (spec, SDK, registry contract), **please do not file a public issue.** Instead, email **security@windydrops.com** with details. We aim to acknowledge within 48 hours.

If the issue is in a specific drop published to the registry (not in the substrate itself), report it through the drop's author channel first. If no response or the issue is critical, email **abuse@windydrops.com**.

## Scope

This policy covers:

- The artifact manifest spec
- The SDK packages (`@windy/drops-*`)
- The registry API contract
- The reference registry service (`sneakyfree/windy-registry`) — see its SECURITY.md too

Out of scope:

- Third-party drops published to the registry — those are the author's responsibility, governed by the Code of Conduct + abuse channels
- Consumer surfaces (Control Panel, Fly, etc.) — see each surface's SECURITY.md
- Infrastructure outside the substrate (Cloudflare, R2, domain registrars)

## Drop signing

Drops MAY be signed by their author's Eternitas Passport. Signed drops carry a trust signal in the registry. Unsigned drops are allowed but flagged as such in the UI; we expect ecosystems and downstream consumers to apply their own policy (e.g., "only show Eternitas-signed drops in the trending feed").

The signing model is defined in ADR-053. Verification logic lives in `@windy/drops-sdk`.
