// registry.ts — HTTP client for the windy-registry service.
//
// Reads the registry base URL from --registry-url, $WINDY_REGISTRY_URL, or
// defaults to https://api.windydrops.com.

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
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${opts.bearerToken}`,
    },
    body: JSON.stringify(opts.payload),
  });
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
