// bundle.test.mjs — WD-6 acceptance tests.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = resolve(__dirname, "../bin/windy-drops");
const REPO = resolve(__dirname, "../../..");

function run(args) {
  return spawnSync("node", [CLI, ...args], { encoding: "utf-8" });
}

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

test("bundle scaffolded example produces a valid zip + matching sha256 sidecar", () => {
  const tmp = mkdtempSync(`${tmpdir()}/wd-bundle-`);
  const drop = `${tmp}/dashboard`;
  try {
    assert.equal(run(["new", "--type", "control-panel-template", drop]).status, 0);
    const result = run(["bundle", drop, "--out", `${tmp}/out`]);
    assert.equal(result.status, 0, result.stderr);

    const zipPath = `${tmp}/out.zip`;
    const shaPath = `${tmp}/out.sha256`;
    assert.ok(existsSync(zipPath));
    assert.ok(existsSync(shaPath));

    const expectedSha = readFileSync(shaPath, "utf-8").trim();
    const actualSha = sha256(readFileSync(zipPath));
    assert.equal(actualSha, expectedSha, "sha256 sidecar must match actual zip");

    // basic ZIP magic check
    const bytes = readFileSync(zipPath);
    assert.equal(bytes.readUInt32LE(0), 0x04034b50, "first 4 bytes must be ZIP LFH signature");
    assert.ok(statSync(zipPath).size > 0);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("bundle is deterministic: same input → identical zip across runs", () => {
  const tmp = mkdtempSync(`${tmpdir()}/wd-bundle-`);
  const drop = `${tmp}/dashboard`;
  try {
    assert.equal(run(["new", "--type", "control-panel-template", drop]).status, 0);

    assert.equal(run(["bundle", drop, "--out", `${tmp}/a`]).status, 0);
    assert.equal(run(["bundle", drop, "--out", `${tmp}/b`]).status, 0);

    const a = readFileSync(`${tmp}/a.zip`);
    const b = readFileSync(`${tmp}/b.zip`);
    assert.deepEqual(Buffer.from(a), Buffer.from(b), "successive bundles must be byte-identical");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("bundle fails before producing zip if validate fails", () => {
  const tmp = mkdtempSync(`${tmpdir()}/wd-bundle-`);
  const drop = `${tmp}/broken`;
  mkdirSync(drop);
  writeFileSync(`${drop}/SKILL.md`, `---
schema: windy.drop.v1
id: broken-no-author
name: Broken
type: skill
version: 1.0.0
license: MIT
---
`);
  try {
    const r = run(["bundle", drop, "--out", `${tmp}/out`]);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /validation failed/);
    assert.equal(existsSync(`${tmp}/out.zip`), false, "must not write zip when validate fails");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("zip excludes ignored entries (.git, node_modules, .DS_Store)", () => {
  const tmp = mkdtempSync(`${tmpdir()}/wd-bundle-`);
  const drop = `${tmp}/dashboard`;
  try {
    assert.equal(run(["new", "--type", "skill", drop]).status, 0);
    // sprinkle ignored entries
    mkdirSync(`${drop}/.git`);
    writeFileSync(`${drop}/.git/HEAD`, "ref: refs/heads/main\n");
    mkdirSync(`${drop}/node_modules`);
    writeFileSync(`${drop}/node_modules/foo.js`, "// noise\n");
    writeFileSync(`${drop}/.DS_Store`, "ds noise");

    assert.equal(run(["bundle", drop, "--out", `${tmp}/out`]).status, 0);
    const bytes = readFileSync(`${tmp}/out.zip`);
    const asString = bytes.toString("latin1");
    assert.ok(!asString.includes(".git/HEAD"));
    assert.ok(!asString.includes("node_modules/foo.js"));
    assert.ok(!asString.includes(".DS_Store"));
    // SKILL.md should still be there
    assert.ok(asString.includes("SKILL.md"));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
