// GENERATED FILE. DO NOT EDIT.
// Run `npm run codegen` from packages/artifact-spec/ to regenerate.
// Source: schemas/windy.drop.v1.json (WD-0 of DNA_STRAND_MASTER_PLAN.md).
//
// This file ships in the @windy/drops-artifact-spec npm package.
// Both this binding and the Python sibling (windy_drops_spec on PyPI) are
// codegen'd from the same JSON Schema. A manifest accepted by one MUST be
// accepted by the other (enforced by WD-11 conformance harness).

import { z } from "zod"

export const DropManifestSchema = z.object({ "schema": z.literal("windy.drop.v1").describe("Self-identifying version of the manifest format. Consumers MUST reject majors they do not understand."), "id": z.string().regex(new RegExp("^[a-z0-9]+(-[a-z0-9]+)*$")).min(1).max(128).describe("Stable globally-unique slug. Case-sensitive, kebab-case. Convention: <author-slug>-<drop-slug>."), "name": z.any().superRefine((x, ctx) => {
    const schemas = [z.string().min(1).max(200), z.object({ "default": z.string().regex(new RegExp("^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2}|-[0-9]{3})?$")).describe("BCP 47 locale tag pointing to the canonical fallback key in this object.") }).catchall(z.string().min(1).max(200).describe("Per-locale translation. Key SHOULD be a BCP 47 locale tag; non-BCP-47 keys are tolerated by binding but ignored by surfaces."))];
    const { errors, failed } = schemas.reduce<{
      errors: z.ZodError[];
      failed: number;
    }>(
      ({ errors, failed }, schema) =>
        ((result) =>
          result.error
            ? {
                errors: [...errors, result.error],
                failed: failed + 1,
              }
            : { errors, failed })(
          schema.safeParse(x),
        ),
      { errors: [], failed: 0 },
    );
    const passed = schemas.length - failed;
    if (passed !== 1) {
      ctx.addIssue(errors.length ? {
        path: ctx.path,
        code: "invalid_union",
        unionErrors: errors,
        message: "Invalid input: Should pass single schema. Passed " + passed,
      } : {
        path: ctx.path,
        code: "custom",
        message: "Invalid input: Should pass single schema. Passed " + passed,
      });
    }
  }).describe("Display name. Plain UTF-8 string OR i18n object with a 'default' locale pointer."), "subtitle": z.any().superRefine((x, ctx) => {
    const schemas = [z.string().min(1).max(200), z.object({ "default": z.string().regex(new RegExp("^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2}|-[0-9]{3})?$")).describe("BCP 47 locale tag pointing to the canonical fallback key in this object.") }).catchall(z.string().min(1).max(200).describe("Per-locale translation. Key SHOULD be a BCP 47 locale tag; non-BCP-47 keys are tolerated by binding but ignored by surfaces."))];
    const { errors, failed } = schemas.reduce<{
      errors: z.ZodError[];
      failed: number;
    }>(
      ({ errors, failed }, schema) =>
        ((result) =>
          result.error
            ? {
                errors: [...errors, result.error],
                failed: failed + 1,
              }
            : { errors, failed })(
          schema.safeParse(x),
        ),
      { errors: [], failed: 0 },
    );
    const passed = schemas.length - failed;
    if (passed !== 1) {
      ctx.addIssue(errors.length ? {
        path: ctx.path,
        code: "invalid_union",
        unionErrors: errors,
        message: "Invalid input: Should pass single schema. Passed " + passed,
      } : {
        path: ctx.path,
        code: "custom",
        message: "Invalid input: Should pass single schema. Passed " + passed,
      });
    }
  }).describe("One-line description. Same i18n shape as 'name'.").optional(), "type": z.enum(["control-panel-template","skill","tool","theme","voice-pack","workflow"]).describe("Reserved drop type for v1. New types are additive; surfaces that don't understand a type filter it out."), "version": z.string().regex(new RegExp("^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$")).describe("SemVer 2.0.0. Each (id, version) is immutable once published."), "forked_from": z.any().superRefine((x, ctx) => {
    const schemas = [z.string().regex(new RegExp("^[a-z0-9]+(-[a-z0-9]+)*$")).min(1).max(128).describe("Lowercase kebab-case slug. Allowed chars: [a-z0-9-]. Must start with [a-z0-9]."), z.null()];
    const { errors, failed } = schemas.reduce<{
      errors: z.ZodError[];
      failed: number;
    }>(
      ({ errors, failed }, schema) =>
        ((result) =>
          result.error
            ? {
                errors: [...errors, result.error],
                failed: failed + 1,
              }
            : { errors, failed })(
          schema.safeParse(x),
        ),
      { errors: [], failed: 0 },
    );
    const passed = schemas.length - failed;
    if (passed !== 1) {
      ctx.addIssue(errors.length ? {
        path: ctx.path,
        code: "invalid_union",
        unionErrors: errors,
        message: "Invalid input: Should pass single schema. Passed " + passed,
      } : {
        path: ctx.path,
        code: "custom",
        message: "Invalid input: Should pass single schema. Passed " + passed,
      });
    }
  }).describe("Drop id of the original this was forked from. null for originals. Filled automatically by SDK on `windy-drops fork`.").optional(), "author": z.array(z.object({ "name": z.string().min(1).max(200), "callsign": z.string().min(1).max(64).optional(), "passport": z.string().regex(new RegExp("^E[THX]\\d{2}-[A-Z0-9]{4}-[A-Z0-9]{4}$")).describe("Eternitas passport. Presence enables signature verification on publish.").optional(), "type": z.enum(["human","agent"]).default("human"), "operator": z.string().regex(new RegExp("^E[THX]\\d{2}-[A-Z0-9]{4}-[A-Z0-9]{4}$")).describe("Required when type='agent'. The human operator's passport (for credit chain + integrity compounding).").optional() }).strict()).min(1).describe("Array of authors. Each is {name, callsign?, passport?, type?, operator?}. type='agent' requires operator (per ADR-053)."), "license": z.string().min(1).max(100).describe("SPDX license identifier (e.g., MIT, Apache-2.0, CC-BY-4.0, proprietary)."), "consumes": z.array(z.string().regex(new RegExp("^[a-z][a-z0-9.]*\\.v[0-9]+$"))).describe("Protocols + versions the drop needs at runtime (e.g., 'windy.vitals.v1').").default([]), "surfaces": z.array(z.string().min(1)).describe("Which consumer surfaces accept this drop (open-ended; surfaces register their own ids).").default([]), "entry": z.string().min(1).describe("Entry-point file (type-dependent; absent for content-only types).").optional(), "depends_on": z.array(z.object({ "id": z.string().regex(new RegExp("^[a-z0-9]+(-[a-z0-9]+)*$")).min(1).max(128).describe("Lowercase kebab-case slug. Allowed chars: [a-z0-9-]. Must start with [a-z0-9]."), "type": z.enum(["control-panel-template","skill","tool","theme","voice-pack","workflow"]).describe("v1 reserved drop types. New types are additive in v1.x via ADR + consumer surface."), "version": z.string().min(1).describe("SemVer range (e.g., '^1.0.0', '~2.1', '>=1.0 <2.0'). Resolved at install time.").optional() }).strict()).describe("Other drops this one composes with. Resolved at install time by the registry.").default([]), "tags": z.array(z.string().min(1).max(64)).describe("Free-form tags for search.").default([]), "preview": z.string().min(1).describe("Path (bundle-relative) to preview image. Recommended 1200x630 PNG.").optional(), "preview_mock_data": z.string().min(1).describe("Path (bundle-relative) to mock data JSON used by the live-preview sandbox.").optional(), "locale_hint": z.string().regex(new RegExp("^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2}|-[0-9]{3})?$")).describe("Primary BCP 47 locale. Used for filtering + sort.").optional(), "pricing": z.object({ "type": z.enum(["free","tip-jar","paid","subscription"]).describe("free + tip-jar ship in v1. paid in v1.1. subscription reserved (not in v1.1).").default("free"), "amount_cents": z.any().superRefine((x, ctx) => {
    const schemas = [z.number().int().gte(100).lte(100000), z.null()];
    const { errors, failed } = schemas.reduce<{
      errors: z.ZodError[];
      failed: number;
    }>(
      ({ errors, failed }, schema) =>
        ((result) =>
          result.error
            ? {
                errors: [...errors, result.error],
                failed: failed + 1,
              }
            : { errors, failed })(
          schema.safeParse(x),
        ),
      { errors: [], failed: 0 },
    );
    const passed = schemas.length - failed;
    if (passed !== 1) {
      ctx.addIssue(errors.length ? {
        path: ctx.path,
        code: "invalid_union",
        unionErrors: errors,
        message: "Invalid input: Should pass single schema. Passed " + passed,
      } : {
        path: ctx.path,
        code: "custom",
        message: "Invalid input: Should pass single schema. Passed " + passed,
      });
    }
  }).describe("Integer cents. Required when type=paid; null otherwise.").optional(), "currency": z.any().superRefine((x, ctx) => {
    const schemas = [z.string().regex(new RegExp("^[A-Z]{3}$")).describe("ISO 4217 currency code (e.g., USD, EUR, JPY)."), z.null()];
    const { errors, failed } = schemas.reduce<{
      errors: z.ZodError[];
      failed: number;
    }>(
      ({ errors, failed }, schema) =>
        ((result) =>
          result.error
            ? {
                errors: [...errors, result.error],
                failed: failed + 1,
              }
            : { errors, failed })(
          schema.safeParse(x),
        ),
      { errors: [], failed: 0 },
    );
    const passed = schemas.length - failed;
    if (passed !== 1) {
      ctx.addIssue(errors.length ? {
        path: ctx.path,
        code: "invalid_union",
        unionErrors: errors,
        message: "Invalid input: Should pass single schema. Passed " + passed,
      } : {
        path: ctx.path,
        code: "custom",
        message: "Invalid input: Should pass single schema. Passed " + passed,
      });
    }
  }).describe("Required when type=paid; null otherwise.").optional() }).strict().and(z.record(z.any())).describe("Pricing block. Defaults to free.").optional(), "monetization": z.object({ "tips_enabled": z.boolean().describe("Opt-in to receive tips on this drop. Requires author Stripe Connect.").default(false), "stripe_account": z.any().superRefine((x, ctx) => {
    const schemas = [z.string().regex(new RegExp("^acct_[a-zA-Z0-9]+$")), z.null()];
    const { errors, failed } = schemas.reduce<{
      errors: z.ZodError[];
      failed: number;
    }>(
      ({ errors, failed }, schema) =>
        ((result) =>
          result.error
            ? {
                errors: [...errors, result.error],
                failed: failed + 1,
              }
            : { errors, failed })(
          schema.safeParse(x),
        ),
      { errors: [], failed: 0 },
    );
    const passed = schemas.length - failed;
    if (passed !== 1) {
      ctx.addIssue(errors.length ? {
        path: ctx.path,
        code: "invalid_union",
        unionErrors: errors,
        message: "Invalid input: Should pass single schema. Passed " + passed,
      } : {
        path: ctx.path,
        code: "custom",
        message: "Invalid input: Should pass single schema. Passed " + passed,
      });
    }
  }).describe("Stripe Connect account id. Filled by SDK after creator OAuth.").optional(), "payout_currency": z.string().regex(new RegExp("^[a-z]{3}$")).describe("ISO 4217 currency code (lowercase, Stripe convention).").default("usd"), "refund_window_days": z.number().int().gte(7).lte(30).describe("Creator-set 7-30. Only meaningful for paid drops.").default(7) }).strict().describe("Monetization controls (tip-jar opt-in, Stripe account, payout currency).").optional(), "royalty": z.object({ "forks_inherit_price": z.boolean().describe("Whether forks of paid drops inherit the parent's price.").default(true), "fork_revenue_share_pct": z.number().int().gte(0).lte(100).describe("Percent of paid-fork sales paid to the original author. Default 50.").default(50) }).strict().describe("Royalty rules for forks. Meaningful when pricing.type=paid.").optional(), "signature": z.object({ "algorithm": z.literal("ES256").describe("v1 supports ES256 only."), "signer": z.object({ "passport": z.string().regex(new RegExp("^E[THX]\\d{2}-[A-Z0-9]{4}-[A-Z0-9]{4}$")).describe("Eternitas passport — ET (agent), EH (human), EX (hybrid). Format: PREFIX-XXXX-XXXX with birth year."), "integrity_band": z.enum(["critical","poor","fair","good","exceptional"]).describe("Snapshot of signer's Eternitas integrity band at signing time. Snapshot only — registry does NOT update later.").optional(), "clearance_level": z.enum(["registered","verified","cleared","top_secret","eternal"]).describe("Snapshot of signer's Eternitas clearance level.").optional() }).strict(), "signed_at": z.string().datetime({ offset: true }).describe("RFC 3339 timestamp."), "signed_digest": z.string().regex(new RegExp("^sha256:[a-f0-9]{64}$")).describe("sha256(canonical_manifest_sans_signature || bundle_sha256_hex)."), "signature": z.string().regex(new RegExp("^[A-Za-z0-9+/]+={0,2}$")).describe("Base64-encoded raw ES256 signature (R||S, 64 bytes → 88 chars base64).") }).strict().describe("Eternitas signature block. Optional; required by registry only when pricing.type=paid (v1.1).").optional(), "control_panel": z.object({ "refresh_interval_ms": z.number().int().gte(100).lte(3600000).describe("How often the template requests fresh Vitals payloads.").default(5000), "supports_remote_fleet": z.boolean().describe("Whether this template renders the per-agent fleet panel.").default(true) }).catchall(z.any()).describe("Type-specific extension for type=control-panel-template. See ADR-054.").optional(), "skill": z.record(z.any()).describe("Type-specific extension for type=skill. Reserved.").optional(), "tool": z.record(z.any()).describe("Type-specific extension for type=tool. Reserved.").optional(), "theme": z.record(z.any()).describe("Type-specific extension for type=theme. Reserved.").optional(), "voice_pack": z.record(z.any()).describe("Type-specific extension for type=voice-pack. Reserved.").optional(), "workflow": z.record(z.any()).describe("Type-specific extension for type=workflow. Reserved.").optional() }).catchall(z.any()).and(z.record(z.any())).describe("Canonical schema for windy.drop.v1 SKILL.md frontmatter. Source of truth; both TypeScript (Zod) and Python (Pydantic v2) bindings codegen from this file. Strand: WD-0 of DNA_STRAND_MASTER_PLAN.md.")
export type DropManifest = z.infer<typeof DropManifestSchema>

/**
 * v1 reserved drop types. New types are additive in v1.x via ADR + consumer
 * surface registration.
 */
export const DROP_TYPES = [
  "control-panel-template",
  "skill",
  "tool",
  "theme",
  "voice-pack",
  "workflow",
] as const;

export type DropType = (typeof DROP_TYPES)[number];

/**
 * v1 pricing types. `free` + `tip-jar` ship in v1; `paid` ships in v1.1;
 * `subscription` is schema-reserved (not in v1.1 — needs new ADR).
 */
export const PRICING_TYPES = ["free", "tip-jar", "paid", "subscription"] as const;
export type PricingType = (typeof PRICING_TYPES)[number];

/**
 * Eternitas integrity bands. Snapshot at signing time; registry does NOT
 * update later (per ADR-053 §"Signing + trust").
 */
export const INTEGRITY_BANDS = [
  "critical",
  "poor",
  "fair",
  "good",
  "exceptional",
] as const;
export type IntegrityBand = (typeof INTEGRITY_BANDS)[number];

export const CLEARANCE_LEVELS = [
  "registered",
  "verified",
  "cleared",
  "top_secret",
  "eternal",
] as const;
export type ClearanceLevel = (typeof CLEARANCE_LEVELS)[number];
