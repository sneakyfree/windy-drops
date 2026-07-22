import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchWithTimeout, REGISTRY_TIMEOUT_MS } from "../dist/lib/http.js";

test("fetchWithTimeout returns the response when the upstream is fast", async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = async () => new Response("ok", { status: 200 });
  try {
    const r = await fetchWithTimeout("https://registry.example/ok");
    assert.equal(r.status, 200);
  } finally {
    globalThis.fetch = orig;
  }
});

test("fetchWithTimeout passes an AbortSignal and preserves caller init", async () => {
  const orig = globalThis.fetch;
  let seen;
  globalThis.fetch = async (_url, init) => {
    seen = init;
    return new Response("ok", { status: 200 });
  };
  try {
    await fetchWithTimeout("https://registry.example/ok", { method: "PUT" });
    assert.ok(seen.signal, "signal was supplied to fetch");
    assert.equal(seen.method, "PUT", "caller init preserved");
  } finally {
    globalThis.fetch = orig;
  }
});

test("fetchWithTimeout aborts a hanging upstream instead of hanging forever", async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = (_url, init) =>
    new Promise((_resolve, reject) => {
      init.signal.addEventListener("abort", () => reject(new Error("aborted")));
    });
  try {
    await assert.rejects(
      () => fetchWithTimeout("https://registry.example/hang", {}, 20),
      /abort/i,
    );
  } finally {
    globalThis.fetch = orig;
  }
});

test("REGISTRY_TIMEOUT_MS is a sane default", () => {
  assert.ok(REGISTRY_TIMEOUT_MS > 0 && REGISTRY_TIMEOUT_MS <= 300_000);
});
