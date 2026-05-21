// new command — scaffold a new drop directory from a starter template.

import chalk from "../lib/chalk-shim.js";
import { scaffold } from "../lib/scaffold.js";

export async function run(opts: { type: string; path: string }): Promise<void> {
  try {
    const result = await scaffold(opts);
    process.stdout.write(
      `${chalk.green("✓")} scaffolded ${opts.type} drop at ${result.targetDir}\n`,
    );
    process.stdout.write(`  ${result.filesCopied.length} files written\n\n`);
    process.stdout.write(`Next steps:\n`);
    process.stdout.write(`  1. Edit ${result.targetDir}/SKILL.md (set author + id)\n`);
    process.stdout.write(`  2. windy-drops validate ${result.targetDir}\n`);
    process.stdout.write(`  3. windy-drops publish ${result.targetDir}\n`);
  } catch (err) {
    process.stderr.write(`${chalk.red("✗")} ${(err as Error).message}\n`);
    process.exit(1);
  }
}
