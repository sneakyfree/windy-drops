// registry.ts — HTTP client for the windy-registry service.
//
// Reads the registry base URL from --registry-url, $WINDY_REGISTRY_URL, or
// defaults to https://api.windydrops.com.

import { fetchWithTimeout } from "./http.js";

export interface PublishPayload {
  manifest: Record<string, unknown>;
  bundle_url: string;
  bundle_sha256: string;
}

export interface PublishedDrop {
  drop_id: string;
  version: string;
  manifest: Record<string, unknown>;
  bundle_url: string;
  bundle_sha256: string;
  signature_verified: boolean;
  signer_passport: string | null;
  signer_integrity_band: string | null;
  signer_clearance_level: string | null;
  published_at: string;
}

export class RegistryError extends Error {
  constructor(message: string, readonly status: number, readonly body: unknown) {
    super(message);
    this.name = "RegistryError";
  }
}

/** Look up a drop by id. Returns null on 404; throws RegistryError otherwise. */
export async function fetchDrop(
  opts: { registryUrl: string; dropId: string },
): Promise<Record<string, unknown> | null> {
  const url = `${opts.registryUrl}/api/v1/drops/${encodeURIComponent(opts.dropId)}`;
  const r = await fetchWithTimeout(url, {}, 15_000);
  if (r.status === 404) return null;
  if (!r.ok) {
    throw new RegistryError(`registry GET drop: ${r.status}`, r.status, await r.text());
  }
  return (await r.json()) as Record<string, unknown>;
}

export function resolveRegistryUrl(opts: { registryUrl?: string } = {}): string {
  return (
    opts.registryUrl ||
    process.env.WINDY_REGISTRY_URL ||
    "https://api.windydrops.com"
  ).replace(/\/$/, "");
}

export async function publishToRegistry(opts: {
  registryUrl: string;
  bearerToken: string;
  payload: PublishPayload;
}): Promise<PublishedDrop> {
  const url = `${opts.registryUrl}/api/v1/drops`;
  const r = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${opts.bearerToken}`,
    },
    body: JSON.stringify(opts.payload),
  }, 30_000);
  if (!r.ok) {
    let body: unknown;
    try {
      body = await r.json();
    } catch {
      body = await r.text();
    }
    throw new RegistryError(
      `registry rejected publish: ${r.status}`,
      r.status,
      body,
    );
  }
  return (await r.json()) as PublishedDrop;
}

export async function uploadBundleBytes(opts: {
  registryUrl: string;
  bearerToken: string;
  dropId: string;
  version: string;
  zipBytes: Uint8Array;
}): Promise<string[]> {
  // PUT the bundle zip to the registry, which re-verifies the SHA-256
  // against the published version row and pushes zip + members to R2.
  const url = `${opts.registryUrl}/api/v1/drops/${opts.dropId}/versions/${opts.version}/bundle`;
  const r = await fetchWithTimeout(url, {
    method: "PUT",
    headers: {
      "content-type": "application/zip",
      authorization: `Bearer ${opts.bearerToken}`,
    },
    body: opts.zipBytes,
  }, 120_000);
  if (!r.ok) {
    let body: unknown;
    try {
      body = await r.json();
    } catch {
      body = await r.text();
    }
    throw new RegistryError(
      `registry rejected bundle upload: ${r.status}`,
      r.status,
      body,
    );
  }
  const data = (await r.json()) as { uploaded?: string[] };
  return data.uploaded ?? [];
}
