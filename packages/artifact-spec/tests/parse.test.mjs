// tests/parse.test.mjs — WD-1 acceptance tests.
//
// Runs the generated Zod schema against the conformance fixtures and asserts:
//   - echo-hq.json parses cleanly
//   - invalid-no-author.json fails with an error path including `author`
//
// Tests run from the dist/ build so we exercise the same artifact npm ships.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../..");
const fixture = (name) =>
  JSON.parse(readFileSync(`${ROOT}/tools/conformance/fixtures/${name}`, "utf-8"));

const { DropManifestSchema, DROP_TYPES } = await import("../dist/index.js");

test("echo-hq.json parses cleanly", () => {
  const result = DropManifestSchema.safeParse(fixture("echo-hq.json"));
  if (!result.success) {
    console.error(JSON.stringify(result.error.issues, null, 2));
  }
  assert.equal(result.success, true);
  assert.equal(result.data.id, "kit-oc5-echo-hq");
  assert.equal(result.data.type, "control-panel-template");
});

test("invalid-no-author.json fails with path including 'author'", () => {
  const result = DropManifestSchema.safeParse(fixture("invalid-no-author.json"));
  assert.equal(result.success, false);
  const hasAuthorError = result.error.issues.some(
    (issue) => issue.path.includes("author") || issue.message.toLowerCase().includes("author"),
  );
  assert.equal(hasAuthorError, true, "expected an issue mentioning 'author'");
});

test("DROP_TYPES enum includes all 6 v1 reserved types", () => {
  assert.deepEqual([...DROP_TYPES].sort(), [
    "control-panel-template",
    "skill",
    "theme",
    "tool",
    "voice-pack",
    "workflow",
  ]);
});

test("single-object author (not array) is rejected", () => {
  const m = fixture("echo-hq.json");
  m.author = m.author[0];
  const result = DropManifestSchema.safeParse(m);
  assert.equal(result.success, false);
});

test("empty author array is rejected", () => {
  const m = fixture("echo-hq.json");
  m.author = [];
  const result = DropManifestSchema.safeParse(m);
  assert.equal(result.success, false);
});
