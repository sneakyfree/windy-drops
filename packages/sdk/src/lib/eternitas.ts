// eternitas.ts — local Eternitas Passport signing.
//
// Reads the author's PEM-encoded EC P-256 private key from one of:
//   --key <path> CLI flag
//   $WINDY_PRIVATE_KEY env var (path to PEM)
//   ~/.windy/eternitas-private-key.pem
//   ~/.windy/credentials.json → eternitas.private_key (inline PEM)
//
// Produces ES256 signatures in raw R||S format (64 bytes → 88-char base64).
// The TypeScript signer must produce byte-identical signed_digest values to
// the Python signer for the same canonical input — verified by extending the
// WD-11 conformance harness.

import { createSign, createPrivateKey, KeyObject } from "node:crypto";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

export interface EternitasCredential {
  passport: string;
  integrityBand?: string;
  clearanceLevel?: string;
  privateKey: KeyObject;
}

function readPemFile(path: string): string {
  return readFileSync(path, "utf-8");
}

export function loadCredential(opts: { keyPath?: string } = {}): EternitasCredential {
  // Order matters — explicit flag wins over env wins over conventional paths.
  const explicit = opts.keyPath ?? process.env.WINDY_PRIVATE_KEY;
  if (explicit) {
    return parseFromPemFile(explicit);
  }

  const conventionalKey = resolve(homedir(), ".windy", "eternitas-private-key.pem");
  try {
    return parseFromPemFile(conventionalKey);
  } catch {
    // fall through to credentials.json
  }

  const credsPath = resolve(homedir(), ".windy", "credentials.json");
  try {
    const raw = JSON.parse(readFileSync(credsPath, "utf-8"));
    const e = raw.eternitas;
    if (!e?.private_key) {
      throw new Error(
        "credentials.json has no eternitas.private_key field (you may need to re-issue via `windy connect`)",
      );
    }
    return {
      passport: e.passport,
      integrityBand: e.integrity_band,
      clearanceLevel: e.clearance_level,
      privateKey: createPrivateKey({ key: e.private_key, format: "pem" }),
    };
  } catch (e) {
    throw new Error(
      `no Eternitas credential found. Provide --key <pem>, set $WINDY_PRIVATE_KEY, ` +
        `or place a PEM at ~/.windy/eternitas-private-key.pem ` +
        `or JSON at ~/.windy/credentials.json (with eternitas.private_key). ` +
        `(${(e as Error).message})`,
    );
  }
}

function parseFromPemFile(path: string): EternitasCredential {
  const pem = readPemFile(path);
  return {
    passport: "",
    privateKey: createPrivateKey({ key: pem, format: "pem" }),
  };
}

/**
 * Sign a UTF-8 string with ES256, returning a base64-encoded raw R||S signature.
 */
export function signES256(message: string, privateKey: KeyObject): string {
  const sign = createSign("SHA256");
  sign.update(message, "utf-8");
  sign.end();
  // dsaEncoding 'ieee-p1363' returns raw R||S (64 bytes for P-256)
  const sig = sign.sign({ key: privateKey, dsaEncoding: "ieee-p1363" });
  return sig.toString("base64");
}
