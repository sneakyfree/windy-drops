// publish.test.mjs — WD-8 acceptance tests.
//
// CLI-side tests use --dry-run (no network). The HTTP-level publishToRegistry
// helper is tested directly by stubbing global fetch.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = resolve(__dirname, "../bin/windy-drops");

function run(args, env = {}) {
  return spawnSync("node", [CLI, ...args], {
    encoding: "utf-8",
    env: { ...process.env, ...env },
  });
}

const { publishToRegistry, resolveRegistryUrl, RegistryError } =
  await import("../dist/lib/registry.js");

test("publish --dry-run prints payload, no network", () => {
  const tmp = mkdtempSync(`${tmpdir()}/wd-publish-`);
  try {
    assert.equal(run(["new", "--type", "skill", `${tmp}/d`]).status, 0);
    const r = run(["publish", `${tmp}/d`, "--dry-run", "--registry-url", "http://nowhere"]);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /dry-run/);
    assert.match(r.stdout, /bundle_sha256/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("publish --dry-run rejects when token missing? no — token only required at POST step", () => {
  // dry-run skips the token check; confirm.
  const tmp = mkdtempSync(`${tmpdir()}/wd-publish-`);
  try {
    assert.equal(run(["new", "--type", "skill", `${tmp}/d`]).status, 0);
    const r = run(
      ["publish", `${tmp}/d`, "--dry-run", "--registry-url", "http://nowhere"],
      { WINDY_REGISTRY_TOKEN: "" },
    );
    assert.equal(r.status, 0);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("publish without --dry-run requires a Bearer token", () => {
  // Live publish path — but we can short-circuit by providing no token at all.
  // The command must exit 2 before any network call.
  const tmp = mkdtempSync(`${tmpdir()}/wd-publish-`);
  try {
    assert.equal(run(["new", "--type", "skill", `${tmp}/d`]).status, 0);
    const r = run(
      ["publish", `${tmp}/d`, "--registry-url", "http://nowhere.invalid"],
      { WINDY_REGISTRY_TOKEN: "" },
    );
    assert.equal(r.status, 2);
    assert.match(r.stderr, /Bearer/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("resolveRegistryUrl resolves --registry-url > env > default", () => {
  // Explicit arg wins.
  assert.equal(resolveRegistryUrl({ registryUrl: "https://foo" }), "https://foo");
  // Trailing slash stripped.
  assert.equal(resolveRegistryUrl({ registryUrl: "https://foo/" }), "https://foo");
  // Env fallback.
  const orig = process.env.WINDY_REGISTRY_URL;
  process.env.WINDY_REGISTRY_URL = "https://bar/";
  try {
    assert.equal(resolveRegistryUrl(), "https://bar");
  } finally {
    process.env.WINDY_REGISTRY_URL = orig;
  }
});

test("publishToRegistry POSTs JSON with Bearer + returns parsed response", async (t) => {
  let captured;
  const origFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    captured = { url: String(url), init };
    return new Response(
      JSON.stringify({
        drop_id: "test-drop",
        version: "1.0.0",
        manifest: { id: "test-drop" },
        bundle_url: "https://drops/test.zip",
        bundle_sha256: "a".repeat(64),
        signature_verified: false,
        signer_passport: null,
        signer_integrity_band: null,
        signer_clearance_level: null,
        published_at: "2026-05-21T00:00:00Z",
      }),
      { status: 201, headers: { "content-type": "application/json" } },
    );
  };
  t.after(() => { globalThis.fetch = origFetch; });

  const result = await publishToRegistry({
    registryUrl: "https://api.windydrops.com",
    bearerToken: "fake-jwt",
    payload: {
      manifest: { id: "test-drop" },
      bundle_url: "https://drops/test.zip",
      bundle_sha256: "a".repeat(64),
    },
  });

  assert.equal(captured.url, "https://api.windydrops.com/api/v1/drops");
  assert.equal(captured.init.method, "POST");
  assert.equal(captured.init.headers.authorization, "Bearer fake-jwt");
  assert.equal(captured.init.headers["content-type"], "application/json");
  const body = JSON.parse(captured.init.body);
  assert.equal(body.manifest.id, "test-drop");
  assert.equal(result.drop_id, "test-drop");
});

test("publishToRegistry throws RegistryError with status + body on non-2xx", async (t) => {
  const origFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(
    JSON.stringify({ detail: { error: "version_already_published" } }),
    { status: 409, headers: { "content-type": "application/json" } },
  );
  t.after(() => { globalThis.fetch = origFetch; });

  await assert.rejects(
    publishToRegistry({
      registryUrl: "https://api",
      bearerToken: "x",
      payload: { manifest: {}, bundle_url: "https://x", bundle_sha256: "a".repeat(64) },
    }),
    (err) => {
      assert.ok(err instanceof RegistryError);
      assert.equal(err.status, 409);
      assert.deepEqual(err.body, { detail: { error: "version_already_published" } });
      return true;
    },
  );
});
