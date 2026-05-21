// new.test.mjs — WD-4 acceptance tests for `windy-drops new`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = resolve(__dirname, "../bin/windy-drops");

function run(args, opts = {}) {
  return spawnSync("node", [CLI, ...args], {
    encoding: "utf-8",
    ...opts,
  });
}

test("--version prints the package version", () => {
  const result = run(["--version"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout.trim(), /^\d+\.\d+\.\d+$/);
});

test("new --type control-panel-template scaffolds a valid SKILL.md", () => {
  const tmp = mkdtempSync(`${tmpdir()}/windy-drops-test-`);
  const target = `${tmp}/my-dashboard`;
  try {
    const result = run(["new", "--type", "control-panel-template", target]);
    assert.equal(result.status, 0, result.stderr);

    const skill = readFileSync(`${target}/SKILL.md`, "utf-8");
    assert.match(skill, /^---/m, "expected YAML frontmatter");
    assert.match(skill, /^type: control-panel-template$/m);
    assert.match(skill, /^id: your-handle-my-dashboard$/m, "id should be rewritten to target dir name");

    assert.ok(existsSync(`${target}/render.js`));
    assert.ok(existsSync(`${target}/styles.css`));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("new --type skill scaffolds a minimal skill", () => {
  const tmp = mkdtempSync(`${tmpdir()}/windy-drops-test-`);
  const target = `${tmp}/my-skill`;
  try {
    const result = run(["new", "--type", "skill", target]);
    assert.equal(result.status, 0, result.stderr);
    const skill = readFileSync(`${target}/SKILL.md`, "utf-8");
    assert.match(skill, /^type: skill$/m);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("new --type bogus rejects with exit 1", () => {
  const tmp = mkdtempSync(`${tmpdir()}/windy-drops-test-`);
  try {
    const result = run(["new", "--type", "not-a-real-type", `${tmp}/x`]);
    assert.equal(result.status, 1);
    assert.match(result.stderr.toLowerCase(), /unknown drop type/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("new on existing non-empty directory rejects with exit 1", () => {
  const tmp = mkdtempSync(`${tmpdir()}/windy-drops-test-`);
  const target = `${tmp}/existing`;
  try {
    mkdirSync(target, { recursive: true });
    writeFileSync(`${target}/preexisting.txt`, "hello");
    const result = run(["new", "--type", "skill", target]);
    assert.equal(result.status, 1);
    assert.match(result.stderr.toLowerCase(), /not empty/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("all 6 v1 reserved types have scaffolds", () => {
  const types = [
    "control-panel-template",
    "skill",
    "tool",
    "theme",
    "voice-pack",
    "workflow",
  ];
  for (const t of types) {
    const tmp = mkdtempSync(`${tmpdir()}/windy-drops-test-`);
    const target = `${tmp}/x`;
    try {
      const result = run(["new", "--type", t, target]);
      assert.equal(result.status, 0, `${t}: ${result.stderr}`);
      const skill = readFileSync(`${target}/SKILL.md`, "utf-8");
      assert.match(skill, new RegExp(`^type: ${t}$`, "m"));
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }
});
