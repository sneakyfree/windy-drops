// validate.test.mjs — WD-5 acceptance tests.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = resolve(__dirname, "../bin/windy-drops");
const REPO = resolve(__dirname, "../../..");

function run(args) {
  return spawnSync("node", [CLI, ...args], { encoding: "utf-8" });
}

function writeSkill(content) {
  const tmp = mkdtempSync(`${tmpdir()}/wd-validate-`);
  writeFileSync(`${tmp}/SKILL.md`, content);
  return tmp;
}

test("validate accepts every scaffolded example", () => {
  const types = [
    "control-panel-template",
    "skill",
    "tool",
    "theme",
    "voice-pack",
    "workflow",
  ];
  for (const t of types) {
    const r = run(["validate", `${REPO}/examples/${t}-minimal`]);
    assert.equal(r.status, 0, `${t} should be valid:\n${r.stderr}`);
    assert.match(r.stdout, /valid/);
  }
});

test("validate rejects manifest missing required author", () => {
  const dir = writeSkill(`---
schema: windy.drop.v1
id: broken-no-author
name: Broken
type: skill
version: 1.0.0
license: MIT
---
`);
  try {
    const r = run(["validate", dir]);
    assert.equal(r.status, 1);
    assert.match(r.stderr.toLowerCase(), /author/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("validate rejects when SKILL.md is missing", () => {
  const dir = mkdtempSync(`${tmpdir()}/wd-validate-`);
  try {
    const r = run(["validate", dir]);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /SKILL\.md/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("validate rejects when frontmatter is missing entirely", () => {
  const dir = writeSkill("# Just a body, no frontmatter\n");
  try {
    const r = run(["validate", dir]);
    assert.equal(r.status, 1);
    assert.match(r.stderr.toLowerCase(), /frontmatter/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("validate rejects bad SemVer", () => {
  const dir = writeSkill(`---
schema: windy.drop.v1
id: bad-semver
name: Bad
type: skill
version: not-semver
author:
  - name: Tester
license: MIT
---
`);
  try {
    const r = run(["validate", dir]);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /version/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
