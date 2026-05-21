#!/usr/bin/env node
// codegen.mjs — WD-1: Generate Zod schemas + TypeScript types from
// ../../schemas/windy.drop.v1.json. Output: src/index.ts.
//
// CI re-runs this on every PR and fails if src/index.ts is stale relative to
// the schema (see .github/workflows/ci.yml).

import { jsonSchemaToZod } from "json-schema-to-zod";
import $RefParser from "@apidevtools/json-schema-ref-parser";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = resolve(__dirname, "../../schemas/windy.drop.v1.json");
const OUTPUT_PATH = resolve(__dirname, "src/index.ts");

// json-schema-to-zod v2 does not follow internal $defs refs, so we
// dereference the schema first into a fully-inlined object.
const schema = await $RefParser.dereference(SCHEMA_PATH);

const zodSource = jsonSchemaToZod(schema, {
  name: "DropManifestSchema",
  module: "esm",
  type: "DropManifest",
  zodVersion: 3,
});

const header = `// GENERATED FILE. DO NOT EDIT.
// Run \`npm run codegen\` from packages/artifact-spec/ to regenerate.
// Source: schemas/windy.drop.v1.json (WD-0 of DNA_STRAND_MASTER_PLAN.md).
//
// This file ships in the @windy/drops-artifact-spec npm package.
// Both this binding and the Python sibling (windy_drops_spec on PyPI) are
// codegen'd from the same JSON Schema. A manifest accepted by one MUST be
// accepted by the other (enforced by WD-11 conformance harness).

`;

const reserved = `
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
 * v1 pricing types. \`free\` + \`tip-jar\` ship in v1; \`paid\` ships in v1.1;
 * \`subscription\` is schema-reserved (not in v1.1 — needs new ADR).
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
`;

writeFileSync(OUTPUT_PATH, header + zodSource + reserved);
console.log(`Wrote ${OUTPUT_PATH}`);
