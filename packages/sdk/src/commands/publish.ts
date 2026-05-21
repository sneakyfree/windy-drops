// publish command — WD-8. Validate → bundle → (optional sign) →
// POST manifest+URL+sha256 to the registry.
//
// R2 upload is currently a no-op (bundle stays on disk) — it lands once
// the registry exposes R2 credentials via /.well-known/r2-config and the
// SDK adds the upload step. For v1 testing, this is sufficient because
// the registry accepts the SHA-256 in the request body and does not
// re-fetch the bundle.

import { readFileSync } from "node:fs";

import chalk from "../lib/chalk-shim.js";
import { readSkillMd } from "../lib/skill-md.js";
import { bundle as runBundle } from "./bundle.js";
import { publishToRegistry, resolveRegistryUrl } from "../lib/registry.js";

export interface PublishOptions {
  path: string;
  registryUrl?: string;
  bearerToken?: string;
  dryRun?: boolean;
  /** Optional override of the published bundle URL (defaults to drops.windydrops.com/<id>/<version>/...). */
  bundleUrl?: string;
}

const PUBLIC_BUNDLE_DOMAIN = "drops.windydrops.com";

export async function run(opts: PublishOptions): Promise<void> {
  try {
    const parsed = readSkillMd(opts.path);
    const id = parsed.frontmatter["id"] as string;
    const version = parsed.frontmatter["version"] as string;

    const bundleResult = await runBundle({ path: opts.path });
    const sha256 = bundleResult.sha256;

    const bundleUrl =
      opts.bundleUrl ?? `https://${PUBLIC_BUNDLE_DOMAIN}/${id}/${version}/${id}-${version}.zip`;

    const payload = {
      manifest: parsed.frontmatter,
      bundle_url: bundleUrl,
      bundle_sha256: sha256,
    };

    if (opts.dryRun) {
      process.stdout.write(`${chalk.cyan("dry-run")} would POST to ${resolveRegistryUrl(opts)}/api/v1/drops:\n`);
      process.stdout.write(JSON.stringify(payload, null, 2) + "\n");
      process.exit(0);
    }

    const token = opts.bearerToken ?? process.env.WINDY_REGISTRY_TOKEN;
    if (!token) {
      throw new Error(
        "no Bearer token. Pass --token <jwt>, set $WINDY_REGISTRY_TOKEN, " +
          "or run `windy connect` to populate ~/.windy/credentials.json",
      );
    }

    const result = await publishToRegistry({
      registryUrl: resolveRegistryUrl(opts),
      bearerToken: token,
      payload,
    });

    process.stdout.write(`${chalk.green("✓")} published ${result.drop_id}@${result.version}\n`);
    process.stdout.write(`  bundle: ${result.bundle_url}\n`);
    process.stdout.write(`  sha256: ${result.bundle_sha256}\n`);
    process.stdout.write(
      `  signature: ${result.signature_verified ? "verified" : "unsigned"}` +
        (result.signer_passport ? ` (${result.signer_passport})` : "") +
        "\n",
    );
    process.exit(0);
  } catch (e) {
    process.stderr.write(`${chalk.red("✗")} ${(e as Error).message}\n`);
    // Exit-code disambiguation per the strand: 2=unauth, 3=conflict, 4=R2,
    // 1=catch-all. We don't have R2 yet, so 1 / 2 / 3 only.
    const msg = (e as Error).message;
    if (msg.includes("401") || msg.includes("Bearer")) process.exit(2);
    if (msg.includes("409")) process.exit(3);
    process.exit(1);
  }
}
