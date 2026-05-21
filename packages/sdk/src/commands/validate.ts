// validate command — WD-5. Parse SKILL.md frontmatter and validate it against
// the windy.drop.v1 schema. Print clear errors with path information.
//
// Exit codes:
//   0 — manifest is valid
//   1 — manifest is invalid (or SKILL.md missing / malformed)

import { DropManifestSchema } from "@windy/drops-artifact-spec";
import chalk from "../lib/chalk-shim.js";
import { readSkillMd, SkillMdError } from "../lib/skill-md.js";

export interface ValidateOptions {
  path: string;
}

export interface ValidateResult {
  valid: boolean;
  errors: ValidateError[];
}

export interface ValidateError {
  path: string;       // dotted field path, e.g., "author.0.passport"
  message: string;
  filePath: string;
}

export async function validate(opts: ValidateOptions): Promise<ValidateResult> {
  let parsed;
  try {
    parsed = readSkillMd(opts.path);
  } catch (e) {
    if (e instanceof SkillMdError) {
      return {
        valid: false,
        errors: [{ path: "", message: e.message, filePath: e.filePath }],
      };
    }
    throw e;
  }

  const result = DropManifestSchema.safeParse(parsed.frontmatter);
  if (result.success) {
    return { valid: true, errors: [] };
  }

  const errors: ValidateError[] = result.error.issues.map((issue) => ({
    path: issue.path.map(String).join(".") || "(root)",
    message: issue.message,
    filePath: parsed.filePath,
  }));

  return { valid: false, errors };
}

export async function run(opts: ValidateOptions): Promise<void> {
  const result = await validate(opts);

  if (result.valid) {
    process.stdout.write(`${chalk.green("✓")} ${opts.path}/SKILL.md is valid\n`);
    process.exit(0);
  }

  for (const err of result.errors) {
    process.stderr.write(
      `${chalk.red("✗")} ${err.filePath}: ${err.path}: ${err.message}\n`,
    );
  }
  process.exit(1);
}
