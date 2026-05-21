// fork command — WD-10. Locally fork a drop: clone the bundle source,
// rewrite SKILL.md (id, author, forked_from, version reset to 1.0.0).
//
// In v1 we accept a LOCAL source (directory or .zip) via --from. Once the
// registry ships, this command will also accept a registry drop-id and
// fetch the bundle automatically (and POST /drops/{id}/fork — WD-19).

import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

import chalk from "../lib/chalk-shim.js";
import { loadCredential } from "../lib/eternitas.js";

export interface ForkOptions {
  from: string;          // local path to source drop directory
  newId: string;         // new drop id
  out: string;           // target directory for the fork
  newName?: string;      // optional human-readable name; defaults to source name + " (forked)"
  authorName?: string;   // overrides credentials/anonymous
  authorPassport?: string;
}

export interface ForkResult {
  sourceDir: string;
  targetDir: string;
  newId: string;
  forkedFrom: string;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n[\s\S]*)?$/;

export async function fork(opts: ForkOptions): Promise<ForkResult> {
  const sourceDir = resolve(opts.from);
  if (!existsSync(sourceDir)) {
    throw new Error(`source not found: ${sourceDir}`);
  }

  const target = resolve(opts.out);
  if (existsSync(target)) {
    const contents = readdirSync(target);
    if (contents.length > 0) {
      throw new Error(`target directory not empty: ${target}`);
    }
  } else {
    await mkdir(target, { recursive: true });
  }

  // Copy the source directory in full.
  await cp(sourceDir, target, { recursive: true });

  // Rewrite SKILL.md manifest.
  const skillPath = resolve(target, "SKILL.md");
  const raw = await readFile(skillPath, "utf-8");
  const match = raw.match(FRONTMATTER_RE);
  if (!match) {
    throw new Error(`source SKILL.md has no frontmatter: ${skillPath}`);
  }

  const manifest = parseYaml(match[1] ?? "") as Record<string, unknown>;
  if (!manifest || typeof manifest !== "object") {
    throw new Error(`source SKILL.md frontmatter must be a YAML object: ${skillPath}`);
  }

  const sourceId = String(manifest["id"] ?? "");
  const sourceName = manifest["name"];

  // Determine new author.
  let newAuthor: Array<Record<string, unknown>>;
  if (opts.authorName) {
    const author: Record<string, unknown> = { name: opts.authorName };
    if (opts.authorPassport) author["passport"] = opts.authorPassport;
    newAuthor = [author];
  } else {
    try {
      const cred = loadCredential({});
      newAuthor = [{
        name: cred.passport || "Your Name",
        ...(cred.passport ? { passport: cred.passport } : {}),
      }];
    } catch {
      newAuthor = [{ name: "Your Name" }];
    }
  }

  manifest["id"] = opts.newId;
  manifest["author"] = newAuthor;
  manifest["forked_from"] = sourceId;
  manifest["version"] = "1.0.0";
  if (opts.newName) {
    manifest["name"] = opts.newName;
  } else if (typeof sourceName === "string") {
    manifest["name"] = `${sourceName} (forked)`;
  }
  // Strip the source signature — a fork is unsigned until the new author signs.
  delete manifest["signature"];

  const yamlOut = stringifyYaml(manifest, { lineWidth: 0, indent: 2 });
  const body = match[2] ?? "";
  await writeFile(skillPath, `---\n${yamlOut.trimEnd()}\n---${body}`, "utf-8");

  return {
    sourceDir,
    targetDir: target,
    newId: opts.newId,
    forkedFrom: sourceId,
  };
}

export async function run(opts: ForkOptions): Promise<void> {
  try {
    const result = await fork(opts);
    process.stdout.write(
      `${chalk.green("✓")} forked ${result.forkedFrom} → ${result.newId}\n`,
    );
    process.stdout.write(`  at ${result.targetDir}\n\n`);
    process.stdout.write(`Next steps:\n`);
    process.stdout.write(`  1. Edit ${result.targetDir}/SKILL.md (review fields)\n`);
    process.stdout.write(`  2. windy-drops validate ${result.targetDir}\n`);
    process.stdout.write(`  3. windy-drops publish ${result.targetDir}\n`);
    process.exit(0);
  } catch (e) {
    process.stderr.write(`${chalk.red("✗")} ${(e as Error).message}\n`);
    process.exit(1);
  }
}
