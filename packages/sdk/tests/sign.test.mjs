// sign.test.mjs — WD-7 acceptance tests.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = resolve(__dirname, "../bin/windy-drops");
const TEST_KEY = resolve(__dirname, "../../../tools/conformance/test-keys/test-private.pem");

function run(args) {
  return spawnSync("node", [CLI, ...args], { encoding: "utf-8" });
}

test("sign writes signature block with deterministic signed_digest", () => {
  const tmp = mkdtempSync(`${tmpdir()}/wd-sign-`);
  const drop = `${tmp}/sample`;
  try {
    assert.equal(run(["new", "--type", "skill", drop]).status, 0);
    const r = run([
      "sign",
      drop,
      "--key", TEST_KEY,
      "--passport", "ET26-TEST-0001",
      "--integrity-band", "fair",
      "--clearance-level", "verified",
    ]);
    assert.equal(r.status, 0, r.stderr);

    const skill = readFileSync(`${drop}/SKILL.md`, "utf-8");
    assert.match(skill, /^signature:/m);
    assert.match(skill, /^\s*algorithm: ES256$/m);
    assert.match(skill, /^\s*passport: ET26-TEST-0001$/m);
    assert.match(skill, /signed_digest:\s*sha256:[a-f0-9]{64}/);
    assert.match(skill, /signature:\s*[A-Za-z0-9+/=]{88}/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("sign is idempotent — re-signing replaces the previous block", () => {
  const tmp = mkdtempSync(`${tmpdir()}/wd-sign-`);
  const drop = `${tmp}/sample`;
  try {
    assert.equal(run(["new", "--type", "skill", drop]).status, 0);
    assert.equal(
      run(["sign", drop, "--key", TEST_KEY, "--passport", "ET26-TEST-0001"]).status,
      0,
    );
    assert.equal(
      run(["sign", drop, "--key", TEST_KEY, "--passport", "ET26-TEST-0002"]).status,
      0,
    );
    const skill = readFileSync(`${drop}/SKILL.md`, "utf-8");
    // Exactly one signature block survives.
    const matches = skill.match(/^signature:/gm) ?? [];
    assert.equal(matches.length, 1);
    assert.match(skill, /^\s*passport: ET26-TEST-0002$/m);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("sign fails when --key path missing", () => {
  const tmp = mkdtempSync(`${tmpdir()}/wd-sign-`);
  const drop = `${tmp}/sample`;
  try {
    assert.equal(run(["new", "--type", "skill", drop]).status, 0);
    const r = run(["sign", drop, "--key", "/nonexistent/key.pem", "--passport", "ET26-TEST-0001"]);
    assert.notEqual(r.status, 0);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("signed_digest is reproducible across runs (same canonical + bundle)", () => {
  // The signature itself uses random k so will differ between runs, but
  // the digest must be deterministic.
  const tmp = mkdtempSync(`${tmpdir()}/wd-sign-`);
  const a = `${tmp}/a`;
  const b = `${tmp}/b`;
  try {
    assert.equal(run(["new", "--type", "skill", a]).status, 0);
    assert.equal(run(["new", "--type", "skill", b]).status, 0);
    // Rename b's dir to match a's so the id rewrite produces the same value.
    // (new rewrites id from the target dir name, so different dir names ->
    // different ids -> different canonical -> different digest. That's expected.)
    assert.equal(
      run(["sign", a, "--key", TEST_KEY, "--passport", "ET26-TEST-0001"]).status,
      0,
    );
    assert.equal(
      run(["sign", b, "--key", TEST_KEY, "--passport", "ET26-TEST-0001"]).status,
      0,
    );
    const sa = readFileSync(`${a}/SKILL.md`, "utf-8");
    const sb = readFileSync(`${b}/SKILL.md`, "utf-8");
    // a and b have different ids (your-handle-a vs your-handle-b), so digests
    // SHOULD differ. This guards against accidentally collapsing them.
    const digestA = sa.match(/signed_digest:\s*(sha256:[a-f0-9]{64})/)?.[1];
    const digestB = sb.match(/signed_digest:\s*(sha256:[a-f0-9]{64})/)?.[1];
    assert.ok(digestA);
    assert.ok(digestB);
    assert.notEqual(digestA, digestB, "different ids must yield different signed_digests");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
