// bundle command — WD-6. Validate the drop, walk its directory, and emit
// a deterministic ZIP + .sha256 sidecar.

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import chalk from "../lib/chalk-shim.js";
import { readSkillMd } from "../lib/skill-md.js";
import { validate } from "./validate.js";
import { collectEntries, DEFAULT_IGNORE, packZip, sha256Hex } from "../lib/zip.js";

export interface BundleOptions {
  path: string;
  out?: string;
}

export interface BundleResult {
  zipPath: string;
  sha256: string;
  size: number;
  entryCount: number;
}

export async function bundle(opts: BundleOptions): Promise<BundleResult> {
  // Validate first — bundle should fail-fast on invalid manifests.
  const v = await validate({ path: opts.path });
  if (!v.valid) {
    throw new Error(
      `validation failed:\n` +
        v.errors
          .map((e) => `  ${e.filePath}: ${e.path}: ${e.message}`)
          .join("\n"),
    );
  }

  const parsed = readSkillMd(opts.path);
  const id = parsed.frontmatter["id"] as string;
  const version = parsed.frontmatter["version"] as string;
  if (!id || !version) {
    throw new Error("manifest missing id or version (should have been caught by validate)");
  }

  const dropDir = resolve(opts.path);
  const entries = collectEntries(dropDir, DEFAULT_IGNORE);
  const zipBuf = packZip(entries);
  const sha256 = sha256Hex(zipBuf);

  const outBase = opts.out
    ? resolve(opts.out)
    : resolve(dropDir, "..", `${id}-${version}`);
  const zipPath = `${outBase}.zip`;
  const shaPath = `${outBase}.sha256`;

  writeFileSync(zipPath, zipBuf);
  writeFileSync(shaPath, `${sha256}\n`);

  return {
    zipPath,
    sha256,
    size: zipBuf.length,
    entryCount: entries.length,
  };
}

export async function run(opts: BundleOptions): Promise<void> {
  try {
    const result = await bundle(opts);
    process.stdout.write(`${chalk.green("✓")} bundled ${result.entryCount} files\n`);
    process.stdout.write(`  ${result.zipPath} (${result.size} bytes)\n`);
    process.stdout.write(`  sha256: ${result.sha256}\n`);
    process.exit(0);
  } catch (e) {
    process.stderr.write(`${chalk.red("✗")} ${(e as Error).message}\n`);
    process.exit(1);
  }
}
