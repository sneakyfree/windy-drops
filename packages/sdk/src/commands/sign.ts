// sign command — WD-7. Sign the manifest with the author's Eternitas
// Passport key. Writes the signature block back into SKILL.md.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { stringify as stringifyYaml } from "yaml";

import chalk from "../lib/chalk-shim.js";
import { canonicalize } from "../lib/canonical.js";
import { loadCredential, signES256 } from "../lib/eternitas.js";
import { readSkillMd } from "../lib/skill-md.js";
import { bundle } from "./bundle.js";

export interface SignOptions {
  path: string;
  keyPath?: string;
  passport?: string;
  integrityBand?: string;
  clearanceLevel?: string;
  /** when supplied, skips re-bundling and uses this sha256 directly. used by tests. */
  bundleSha256?: string;
}

export interface SignResult {
  passport: string;
  signedDigest: string;
  signature: string;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n[\s\S]*)?$/;

export async function sign(opts: SignOptions): Promise<SignResult> {
  const parsed = readSkillMd(opts.path);

  // Determine bundle SHA-256 (either supplied or recompute).
  let bundleSha256: string;
  if (opts.bundleSha256) {
    bundleSha256 = opts.bundleSha256;
  } else {
    const tmpResult = await bundle({ path: opts.path, out: `${parsed.filePath}.signtmp` });
    bundleSha256 = tmpResult.sha256;
    // Note: we leave the tmp zip/sha on disk; caller may delete or reuse for publish.
  }

  const cred = loadCredential({ keyPath: opts.keyPath });
  const passport = opts.passport ?? cred.passport;
  if (!passport) {
    throw new Error(
      "no passport in credentials and --passport not supplied. " +
        "Provide --passport ET26-XXXX-YYYY or use credentials.json with eternitas.passport set.",
    );
  }

  // Canonical manifest sans signature.
  const manifestSansSig: Record<string, unknown> = { ...parsed.frontmatter };
  delete manifestSansSig["signature"];
  const canonical = canonicalize(manifestSansSig);
  const message = canonical + bundleSha256;

  const digest = "sha256:" + createHash("sha256").update(message, "utf-8").digest("hex");
  const signature = signES256(message, cred.privateKey);

  const sigBlock: Record<string, unknown> = {
    algorithm: "ES256",
    signer: {
      passport,
      ...(opts.integrityBand ?? cred.integrityBand
        ? { integrity_band: opts.integrityBand ?? cred.integrityBand }
        : {}),
      ...(opts.clearanceLevel ?? cred.clearanceLevel
        ? { clearance_level: opts.clearanceLevel ?? cred.clearanceLevel }
        : {}),
    },
    signed_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    signed_digest: digest,
    signature,
  };

  // Splice the signature block into the SKILL.md frontmatter (idempotent —
  // replaces an existing signature if present).
  const newFrontmatter = { ...manifestSansSig, signature: sigBlock };
  const yaml = stringifyYaml(newFrontmatter, { lineWidth: 0, indent: 2 });
  const raw = readFileSync(parsed.filePath, "utf-8");
  const match = raw.match(FRONTMATTER_RE);
  if (!match) throw new Error(`SKILL.md frontmatter regex unexpectedly failed for ${parsed.filePath}`);
  const body = match[2] ?? "";
  writeFileSync(parsed.filePath, `---\n${yaml.trimEnd()}\n---${body}`, "utf-8");

  return { passport, signedDigest: digest, signature };
}

export async function run(opts: SignOptions): Promise<void> {
  try {
    const result = await sign(opts);
    process.stdout.write(`${chalk.green("✓")} signed by ${result.passport}\n`);
    process.stdout.write(`  digest:    ${result.signedDigest}\n`);
    process.stdout.write(`  signature: ${result.signature.slice(0, 16)}...\n`);
    process.exit(0);
  } catch (e) {
    process.stderr.write(`${chalk.red("✗")} ${(e as Error).message}\n`);
    process.exit(1);
  }
}
