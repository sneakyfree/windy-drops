// http.ts — bounded fetch for windy-registry calls.
//
// Every registry request previously used bare `fetch` with no timeout, so a
// hung registry or CDN would hang the CLI forever. The Python SDK already
// bounds its httpx calls (15s/30s/120s); this closes that asymmetry on the TS
// side. On timeout the AbortController aborts and `fetch` rejects, which the
// CLI surfaces as a normal error instead of an indefinite hang.

/** Default ceiling for a registry request (ms). */
export const REGISTRY_TIMEOUT_MS = 30_000;

export async function fetchWithTimeout(
  url: string,
  init: Parameters<typeof fetch>[1] = {},
  timeoutMs: number = REGISTRY_TIMEOUT_MS,
): Promise<Awaited<ReturnType<typeof fetch>>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
