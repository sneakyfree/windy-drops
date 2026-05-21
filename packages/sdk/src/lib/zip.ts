// zip.ts — deterministic ZIP writer (STORED method only).
//
// Writes ZIP files byte-for-byte identical to the Python sibling
// `windy_drops.lib.zip.write_zip()`. Achieved by:
//   - STORED (no compression) — no DEFLATE variance between libraries
//   - Lexicographic entry sort
//   - Fixed mtime = MS-DOS epoch (1980-01-01 00:00:00)
//   - Fixed file mode = 0o644 in external attributes
//   - Flag bit 11 set (UTF-8 filename encoding)
//   - No extra fields, no file comment
//
// Strand: WD-6 of DNA_STRAND_MASTER_PLAN.md. Byte-identity verified by WD-11.

import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

const LFH_SIG = 0x04034b50;
const CDR_SIG = 0x02014b50;
const EOCD_SIG = 0x06054b50;

const VERSION = 20;          // PKZip version 2.0
const FLAGS = 0x0800;        // UTF-8 filename encoding (bit 11)
const METHOD_STORED = 0;
const MSDOS_EPOCH_TIME = 0;       // 00:00:00
const MSDOS_EPOCH_DATE = 0x0021;  // 1980-01-01
const EXTERNAL_ATTR = (0o644 & 0xffff) << 16;

// CRC-32 (ISO 3309 / IEEE) implemented locally so we never depend on
// platform-specific behaviour of node:crypto for CRC.
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]!) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
  /** Path inside the zip, always forward-slash separated. */
  name: string;
  /** File content. */
  data: Buffer;
}

/** Pack a sorted set of entries into a deterministic ZIP buffer. */
export function packZip(entries: ZipEntry[]): Buffer {
  // Defensive: sort lexicographically by name.
  const sorted = [...entries].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

  const parts: Buffer[] = [];
  const cdr: Buffer[] = [];

  let offset = 0;

  for (const entry of sorted) {
    const nameBuf = Buffer.from(entry.name, "utf-8");
    const crc = crc32(entry.data);
    const size = entry.data.length;

    // Local File Header.
    const lfh = Buffer.alloc(30);
    lfh.writeUInt32LE(LFH_SIG, 0);
    lfh.writeUInt16LE(VERSION, 4);
    lfh.writeUInt16LE(FLAGS, 6);
    lfh.writeUInt16LE(METHOD_STORED, 8);
    lfh.writeUInt16LE(MSDOS_EPOCH_TIME, 10);
    lfh.writeUInt16LE(MSDOS_EPOCH_DATE, 12);
    lfh.writeUInt32LE(crc, 14);
    lfh.writeUInt32LE(size, 18);  // compressed (== uncompressed for STORED)
    lfh.writeUInt32LE(size, 22);
    lfh.writeUInt16LE(nameBuf.length, 26);
    lfh.writeUInt16LE(0, 28);     // extra length = 0
    parts.push(lfh, nameBuf, entry.data);

    // Central Directory Record.
    const cdrEntry = Buffer.alloc(46);
    cdrEntry.writeUInt32LE(CDR_SIG, 0);
    cdrEntry.writeUInt16LE(VERSION, 4);   // version made by
    cdrEntry.writeUInt16LE(VERSION, 6);   // version needed
    cdrEntry.writeUInt16LE(FLAGS, 8);
    cdrEntry.writeUInt16LE(METHOD_STORED, 10);
    cdrEntry.writeUInt16LE(MSDOS_EPOCH_TIME, 12);
    cdrEntry.writeUInt16LE(MSDOS_EPOCH_DATE, 14);
    cdrEntry.writeUInt32LE(crc, 16);
    cdrEntry.writeUInt32LE(size, 20);
    cdrEntry.writeUInt32LE(size, 24);
    cdrEntry.writeUInt16LE(nameBuf.length, 28);
    cdrEntry.writeUInt16LE(0, 30);  // extra length
    cdrEntry.writeUInt16LE(0, 32);  // comment length
    cdrEntry.writeUInt16LE(0, 34);  // disk number
    cdrEntry.writeUInt16LE(0, 36);  // internal attrs
    cdrEntry.writeUInt32LE(EXTERNAL_ATTR, 38);
    cdrEntry.writeUInt32LE(offset, 42); // offset of LFH
    cdr.push(cdrEntry, nameBuf);

    offset += lfh.length + nameBuf.length + entry.data.length;
  }

  const cdrStartOffset = offset;
  const cdrBuf = Buffer.concat(cdr);
  parts.push(cdrBuf);
  offset += cdrBuf.length;

  // End of Central Directory.
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(EOCD_SIG, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(sorted.length, 8);
  eocd.writeUInt16LE(sorted.length, 10);
  eocd.writeUInt32LE(cdrBuf.length, 12);
  eocd.writeUInt32LE(cdrStartOffset, 16);
  eocd.writeUInt16LE(0, 20); // comment length
  parts.push(eocd);

  return Buffer.concat(parts);
}

/** Walk a directory and return sorted entries suitable for packZip. */
export function collectEntries(rootDir: string, ignore: Set<string>): ZipEntry[] {
  const root = resolve(rootDir);
  const entries: ZipEntry[] = [];

  function walk(dir: string): void {
    const names = readdirSync(dir).sort();
    for (const name of names) {
      const full = `${dir}${sep}${name}`;
      if (ignore.has(name)) continue;
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full);
      } else if (st.isFile()) {
        const rel = relative(root, full).split(sep).join("/");
        entries.push({ name: rel, data: readFileSync(full) });
      }
    }
  }

  walk(root);
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return entries;
}

/** Default ignore list — common build / VCS / OS detritus. */
export const DEFAULT_IGNORE = new Set([
  ".git",
  ".gitignore",
  "node_modules",
  "__pycache__",
  ".pytest_cache",
  ".ruff_cache",
  ".venv",
  ".DS_Store",
  "Thumbs.db",
  "dist",
  "build",
]);

export function sha256Hex(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}
