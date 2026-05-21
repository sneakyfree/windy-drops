// skill-md.ts — parse a SKILL.md file into its YAML frontmatter object + body.
// Used by every SDK command that needs to read or rewrite a drop's manifest.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";

export interface ParsedSkillMd {
  filePath: string;
  frontmatter: Record<string, unknown>;
  body: string;
  // Line at which the frontmatter starts in the source (always 1 for valid files).
  frontmatterStartLine: number;
  // Line at which the body starts (after the closing ---).
  bodyStartLine: number;
}

export class SkillMdError extends Error {
  constructor(message: string, readonly filePath: string) {
    super(`${filePath}: ${message}`);
    this.name = "SkillMdError";
  }
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function readSkillMd(dropDir: string): ParsedSkillMd {
  const filePath = resolve(dropDir, "SKILL.md");
  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch (e) {
    throw new SkillMdError(`SKILL.md not found (${(e as Error).message})`, filePath);
  }

  const match = raw.match(FRONTMATTER_RE);
  if (!match) {
    throw new SkillMdError(
      "no YAML frontmatter (must begin with `---` and contain a closing `---`)",
      filePath,
    );
  }

  let frontmatter: unknown;
  try {
    frontmatter = parseYaml(match[1] ?? "");
  } catch (e) {
    throw new SkillMdError(`YAML parse error: ${(e as Error).message}`, filePath);
  }

  if (typeof frontmatter !== "object" || frontmatter === null || Array.isArray(frontmatter)) {
    throw new SkillMdError("frontmatter must be a YAML object", filePath);
  }

  const body = match[2] ?? "";
  const yamlLineCount = (match[1] ?? "").split(/\r?\n/).length;
  // 1: opening `---`; +yamlLineCount; +1: closing `---`. Body starts on the next line.
  const bodyStartLine = 2 + yamlLineCount;

  return {
    filePath,
    frontmatter: frontmatter as Record<string, unknown>,
    body,
    frontmatterStartLine: 1,
    bodyStartLine,
  };
}
