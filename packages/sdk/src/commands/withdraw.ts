// withdraw command — WD-9 (SDK side).

import chalk from "../lib/chalk-shim.js";
import { resolveRegistryUrl, RegistryError } from "../lib/registry.js";

export interface WithdrawOptions {
  dropId: string;
  registryUrl?: string;
  bearerToken?: string;
  confirm?: boolean;
}

export async function run(opts: WithdrawOptions): Promise<void> {
  try {
    if (!opts.confirm) {
      process.stderr.write(
        `Re-run with --confirm to withdraw '${opts.dropId}'. Bundles will stay on R2 ` +
          `so already-installed users keep working, but the drop will be hidden from ` +
          `browse + trending.\n`,
      );
      process.exit(1);
    }

    const token = opts.bearerToken ?? process.env.WINDY_REGISTRY_TOKEN;
    if (!token) {
      throw new Error("no Bearer token. Pass --token <jwt> or set $WINDY_REGISTRY_TOKEN");
    }

    const url = `${resolveRegistryUrl(opts)}/api/v1/drops/${encodeURIComponent(opts.dropId)}`;
    const r = await fetch(url, {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` },
    });
    if (!r.ok) {
      let body;
      try { body = await r.json(); } catch { body = await r.text(); }
      throw new RegistryError(`withdraw failed: ${r.status}`, r.status, body);
    }

    process.stdout.write(`${chalk.green("✓")} withdrew ${opts.dropId}\n`);
    process.stdout.write(
      `  bundle remains on R2; installed users keep working.\n`,
    );
    process.exit(0);
  } catch (e) {
    process.stderr.write(`${chalk.red("✗")} ${(e as Error).message}\n`);
    const msg = (e as Error).message;
    if (msg.includes("401") || msg.includes("Bearer")) process.exit(2);
    if (msg.includes("403")) process.exit(2);
    if (msg.includes("404")) process.exit(4);
    process.exit(1);
  }
}
