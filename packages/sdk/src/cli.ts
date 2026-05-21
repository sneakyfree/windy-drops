#!/usr/bin/env node
// cli.ts — commander root. Subcommands lazy-load to keep startup snappy.

import { Command } from "commander";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const pkg = JSON.parse(
  readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), "../package.json"),
    "utf-8",
  ),
);

const program = new Command();
program
  .name("windy-drops")
  .description("CLI for publishing Windy Drops")
  .version(pkg.version);

program
  .command("new")
  .description("Scaffold a new drop directory from a starter template")
  .requiredOption(
    "-t, --type <type>",
    "drop type (control-panel-template | skill | tool | theme | voice-pack | workflow)",
  )
  .argument("<path>", "directory to create (must not exist or must be empty)")
  .action(async (path: string, opts: { type: string }) => {
    const { run } = await import("./commands/new.js");
    await run({ type: opts.type, path });
  });

program
  .command("validate")
  .description("Validate a drop's SKILL.md frontmatter against the schema")
  .argument("<path>", "drop directory")
  .action(async (path: string) => {
    const { run } = await import("./commands/validate.js");
    await run({ path });
  });

program
  .command("bundle")
  .description("Produce a deterministic .zip + SHA-256 digest (WD-6)")
  .argument("<path>", "drop directory")
  .action(async () => {
    console.error("bundle: not yet implemented (WD-6)");
    process.exit(2);
  });

program
  .command("sign")
  .description("Sign the manifest with the author's Eternitas Passport (WD-7)")
  .argument("<path>", "drop directory")
  .action(async () => {
    console.error("sign: not yet implemented (WD-7)");
    process.exit(2);
  });

program
  .command("publish")
  .description("Validate, bundle, sign, upload to R2, POST to registry (WD-8)")
  .argument("<path>", "drop directory")
  .action(async () => {
    console.error("publish: not yet implemented (WD-8)");
    process.exit(2);
  });

program
  .command("withdraw")
  .description("Hide a drop from search; existing installs keep working (WD-9)")
  .argument("<drop-id>", "drop id to withdraw")
  .action(async () => {
    console.error("withdraw: not yet implemented (WD-9)");
    process.exit(2);
  });

program
  .command("fork")
  .description("Clone a published drop locally, rewriting the manifest (WD-10)")
  .argument("<source-drop-id>", "drop to fork")
  .argument("<new-id>", "id for your fork")
  .action(async () => {
    console.error("fork: not yet implemented (WD-10)");
    process.exit(2);
  });

await program.parseAsync(process.argv);
