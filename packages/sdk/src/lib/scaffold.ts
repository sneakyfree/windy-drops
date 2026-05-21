// scaffold.ts — copy a per-type starter directory from examples/<type>-minimal/
// into a user-specified path, rewriting placeholders.
//
// The examples directory is the source of truth — updating an example
// automatically updates what `windy-drops new` produces.

import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const RESERVED_DROP_TYPES = [
  "control-panel-template",
  "skill",
  "tool",
  "theme",
  "voice-pack",
  "workflow",
] as const;

export type DropType = (typeof RESERVED_DROP_TYPES)[number];

export interface ScaffoldOptions {
  type: string;
  path: string;
}

export interface ScaffoldResult {
  examplesDir: string;
  targetDir: string;
  filesCopied: string[];
}

// Locate the repo's examples/ directory. Walks up from this file looking
// for `examples/<type>-minimal/`. When the SDK is installed via npm, the
// examples ship inside the package bundle (`packages/sdk/examples/` mirrored
// at publish time). For now we resolve relative to the source tree.
function findExamplesRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  // Try: <here>/../../examples (when running from packages/sdk/dist/lib/)
  // and: <here>/../examples (when bundled as a single-folder package)
  const candidates = [
    resolve(here, "../../../../examples"),
    resolve(here, "../../../examples"),
    resolve(here, "../../examples"),
    resolve(here, "../examples"),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  throw new Error(
    `Could not locate examples/ directory. Searched: ${candidates.join(", ")}`,
  );
}

export async function scaffold(opts: ScaffoldOptions): Promise<ScaffoldResult> {
  if (!RESERVED_DROP_TYPES.includes(opts.type as DropType)) {
    throw new Error(
      `Unknown drop type: ${opts.type}. Must be one of: ${RESERVED_DROP_TYPES.join(", ")}`,
    );
  }

  const examplesRoot = findExamplesRoot();
  const examplesDir = resolve(examplesRoot, `${opts.type}-minimal`);

  if (!existsSync(examplesDir)) {
    throw new Error(`No starter scaffold for type ${opts.type} at ${examplesDir}`);
  }

  const targetDir = resolve(opts.path);
  if (existsSync(targetDir)) {
    const contents = await readdir(targetDir).catch(() => []);
    if (contents.length > 0) {
      throw new Error(`Target directory not empty: ${targetDir}`);
    }
  } else {
    await mkdir(targetDir, { recursive: true });
  }

  await cp(examplesDir, targetDir, { recursive: true });

  // Rewrite the placeholder `id` to a target-dir-named id so the scaffold
  // isn't a duplicate-id-on-publish footgun.
  const skillPath = resolve(targetDir, "SKILL.md");
  const skillBody = await readFile(skillPath, "utf-8");
  const slug = targetDir.split("/").pop() ?? "my-drop";
  const rewritten = skillBody.replace(
    /^id: your-handle-(.+)$/m,
    `id: your-handle-${slug}`,
  );
  await writeFile(skillPath, rewritten, "utf-8");

  const filesCopied = await listFiles(targetDir);
  return { examplesDir, targetDir, filesCopied };
}

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => `${e.parentPath ?? e.path}/${e.name}`)
    .sort();
}
