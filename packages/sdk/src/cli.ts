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
  .description("Produce a deterministic .zip + SHA-256 digest")
  .argument("<path>", "drop directory")
  .option("-o, --out <prefix>", "output path prefix (default: <parent>/<id>-<version>)")
  .action(async (path: string, opts: { out?: string }) => {
    const { run } = await import("./commands/bundle.js");
    await run({ path, out: opts.out });
  });

program
  .command("sign")
  .description("Sign the manifest with the author's Eternitas Passport (ES256)")
  .argument("<path>", "drop directory")
  .option("--key <pem-path>", "explicit path to EC P-256 private key PEM")
  .option("--passport <id>", "Eternitas passport id (overrides credentials.json)")
  .option("--integrity-band <band>", "snapshot integrity band (critical|poor|fair|good|exceptional)")
  .option("--clearance-level <level>", "snapshot clearance level")
  .action(
    async (
      path: string,
      opts: {
        key?: string;
        passport?: string;
        integrityBand?: string;
        clearanceLevel?: string;
      },
    ) => {
      const { run } = await import("./commands/sign.js");
      await run({
        path,
        keyPath: opts.key,
        passport: opts.passport,
        integrityBand: opts.integrityBand,
        clearanceLevel: opts.clearanceLevel,
      });
    },
  );

program
  .command("publish")
  .description("Validate, bundle, then POST to the registry")
  .argument("<path>", "drop directory")
  .option("--registry-url <url>", "registry base URL (defaults to https://api.windydrops.com)")
  .option("--token <jwt>", "Bearer token (defaults to $WINDY_REGISTRY_TOKEN)")
  .option("--bundle-url <url>", "override the public bundle URL recorded in the registry")
  .option("--dry-run", "print payload + exit (no upload, no POST)")
  .action(
    async (
      path: string,
      opts: {
        registryUrl?: string;
        token?: string;
        bundleUrl?: string;
        dryRun?: boolean;
      },
    ) => {
      const { run } = await import("./commands/publish.js");
      await run({
        path,
        registryUrl: opts.registryUrl,
        bearerToken: opts.token,
        bundleUrl: opts.bundleUrl,
        dryRun: opts.dryRun,
      });
    },
  );

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
  .description("Clone a drop locally and rewrite its manifest (id/author/forked_from/version reset)")
  .requiredOption("--from <path>", "local source drop directory (registry fetch lands once WD-12 ships)")
  .argument("<new-id>", "id for your fork")
  .argument("<target>", "directory to write the fork into (must be empty)")
  .option("--name <name>", "human-readable name for the fork")
  .option("--author-name <name>", "explicit author name; defaults to credentials.json")
  .option("--author-passport <id>", "explicit author passport id")
  .action(
    async (
      newId: string,
      target: string,
      opts: {
        from: string;
        name?: string;
        authorName?: string;
        authorPassport?: string;
      },
    ) => {
      const { run } = await import("./commands/fork.js");
      await run({
        from: opts.from,
        newId,
        out: target,
        newName: opts.name,
        authorName: opts.authorName,
        authorPassport: opts.authorPassport,
      });
    },
  );

await program.parseAsync(process.argv);
