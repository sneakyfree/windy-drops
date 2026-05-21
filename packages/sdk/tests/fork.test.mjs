// fork.test.mjs — WD-10 acceptance tests.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = resolve(__dirname, "../bin/windy-drops");

function run(args) {
  return spawnSync("node", [CLI, ...args], { encoding: "utf-8" });
}

test("fork rewrites id + forked_from + version, defaults name suffix", () => {
  const tmp = mkdtempSync(`${tmpdir()}/wd-fork-`);
  const src = `${tmp}/source`;
  const dst = `${tmp}/forked`;
  try {
    assert.equal(run(["new", "--type", "skill", src]).status, 0);
    const r = run([
      "fork",
      "--from", src,
      "--author-name", "Tester",
      "my-fork-id",
      dst,
    ]);
    assert.equal(r.status, 0, r.stderr);

    const skill = readFileSync(`${dst}/SKILL.md`, "utf-8");
    assert.match(skill, /^id: my-fork-id$/m);
    assert.match(skill, /^forked_from: your-handle-source$/m);
    assert.match(skill, /^version: 1\.0\.0$/m);
    assert.match(skill, /\(forked\)/);
    assert.match(skill, /name: Tester/);

    // Forked manifest must validate cleanly.
    const v = run(["validate", dst]);
    assert.equal(v.status, 0, v.stderr);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("fork --name overrides default '(forked)' suffix", () => {
  const tmp = mkdtempSync(`${tmpdir()}/wd-fork-`);
  const src = `${tmp}/source`;
  try {
    assert.equal(run(["new", "--type", "skill", src]).status, 0);
    const dst = `${tmp}/forked`;
    const r = run([
      "fork",
      "--from", src,
      "--name", "Custom Name",
      "--author-name", "Tester",
      "my-fork",
      dst,
    ]);
    assert.equal(r.status, 0, r.stderr);
    const skill = readFileSync(`${dst}/SKILL.md`, "utf-8");
    assert.match(skill, /^name: Custom Name$/m);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("fork strips a pre-existing signature from the source", () => {
  const tmp = mkdtempSync(`${tmpdir()}/wd-fork-`);
  const src = `${tmp}/source`;
  const dst = `${tmp}/forked`;
  const key = resolve(__dirname, "../../../tools/conformance/test-keys/test-private.pem");
  try {
    assert.equal(run(["new", "--type", "skill", src]).status, 0);
    assert.equal(
      run(["sign", src, "--key", key, "--passport", "ET26-TEST-0001"]).status,
      0,
    );
    assert.equal(
      run(["fork", "--from", src, "--author-name", "T", "my-fork", dst]).status,
      0,
    );
    const skill = readFileSync(`${dst}/SKILL.md`, "utf-8");
    assert.doesNotMatch(skill, /^signature:/m);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("fork rejects existing non-empty target dir", () => {
  const tmp = mkdtempSync(`${tmpdir()}/wd-fork-`);
  const src = `${tmp}/source`;
  const dst = `${tmp}/forked`;
  try {
    assert.equal(run(["new", "--type", "skill", src]).status, 0);
    assert.equal(run(["new", "--type", "skill", dst]).status, 0);
    const r = run([
      "fork", "--from", src, "--author-name", "T", "my-fork", dst,
    ]);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /not empty/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("fork rejects when source dir missing", () => {
  const tmp = mkdtempSync(`${tmpdir()}/wd-fork-`);
  try {
    const r = run([
      "fork", "--from", `${tmp}/nope`, "--author-name", "T", "my-fork", `${tmp}/out`,
    ]);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /not found/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
