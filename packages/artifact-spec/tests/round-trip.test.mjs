// tests/round-trip.test.mjs — WD-3 acceptance: every valid fixture round-trips
// through the TS binding (parse → serialize → re-parse → deepEqual).
//
// Invalid fixtures are exercised in parse.test.mjs and the schema-level
// runner (tools/conformance/run.sh).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(__dirname, "../../../tools/conformance/fixtures");

const { DropManifestSchema } = await import("../dist/index.js");

const valid = readdirSync(FIXTURES)
  .filter((f) => f.endsWith(".json") && !f.startsWith("invalid-"));
const invalid = readdirSync(FIXTURES)
  .filter((f) => f.startsWith("invalid-") && f.endsWith(".json"));

// Fixtures the SCHEMA correctly rejects but the codegen bindings can't catch
// because json-schema-to-zod (and datamodel-code-generator on the Python side)
// don't translate JSON Schema conditional logic (if/then, allOf > if/then).
// Both binding sides have identical gaps; the SDK's `validate` command
// (WD-5) uses raw JSON Schema validation to plug this gap before publish.
const SCHEMA_ONLY_INVALID = new Set([
  "invalid-agent-no-operator.json",
]);

for (const name of valid) {
  test(`valid: ${name} round-trips`, () => {
    const raw = JSON.parse(readFileSync(`${FIXTURES}/${name}`, "utf-8"));
    const first = DropManifestSchema.parse(raw);
    const serialized = JSON.parse(JSON.stringify(first));
    const second = DropManifestSchema.parse(serialized);
    assert.deepEqual(second, first);
  });
}

for (const name of invalid) {
  if (SCHEMA_ONLY_INVALID.has(name)) {
    test(`invalid (schema-only): ${name} skipped at binding layer`, { skip: true }, () => {});
    continue;
  }
  test(`invalid: ${name} rejected`, () => {
    const raw = JSON.parse(readFileSync(`${FIXTURES}/${name}`, "utf-8"));
    const result = DropManifestSchema.safeParse(raw);
    assert.equal(result.success, false, `expected ${name} to be rejected`);
  });
}
