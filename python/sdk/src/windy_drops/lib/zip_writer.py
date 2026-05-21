"""zip_writer.py — deterministic ZIP writer (STORED method only).

Writes ZIP files byte-for-byte identical to the TypeScript sibling
`packages/sdk/src/lib/zip.ts`. Achieved by:
  - STORED (no compression) — no DEFLATE variance between libraries
  - Lexicographic entry sort
  - Fixed mtime = MS-DOS epoch (1980-01-01 00:00:00)
  - Fixed file mode = 0o644 in external attributes
  - Flag bit 11 set (UTF-8 filename encoding)
  - No extra fields, no file comment

Strand: WD-6 of docs/DNA_STRAND_MASTER_PLAN.md.
Byte-identity verified by WD-11 conformance harness.
"""

from __future__ import annotations

import hashlib
import struct
import zlib
from dataclasses import dataclass
from pathlib import Path

LFH_SIG = 0x04034B50
CDR_SIG = 0x02014B50
EOCD_SIG = 0x06054B50

VERSION = 20
FLAGS = 0x0800  # UTF-8 filename encoding
METHOD_STORED = 0
MSDOS_EPOCH_TIME = 0
MSDOS_EPOCH_DATE = 0x0021  # 1980-01-01
EXTERNAL_ATTR = (0o644 & 0xFFFF) << 16

DEFAULT_IGNORE: frozenset[str] = frozenset(
    {
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
    }
)


@dataclass(frozen=True)
class ZipEntry:
    name: str
    data: bytes


def pack_zip(entries: list[ZipEntry]) -> bytes:
    """Pack entries into a deterministic ZIP byte string."""
    sorted_entries = sorted(entries, key=lambda e: e.name)

    parts: list[bytes] = []
    cdr_parts: list[bytes] = []
    offset = 0

    for entry in sorted_entries:
        name_bytes = entry.name.encode("utf-8")
        crc = zlib.crc32(entry.data) & 0xFFFFFFFF
        size = len(entry.data)

        # Local File Header (30 bytes).
        lfh = struct.pack(
            "<IHHHHHIIIHH",
            LFH_SIG,
            VERSION,
            FLAGS,
            METHOD_STORED,
            MSDOS_EPOCH_TIME,
            MSDOS_EPOCH_DATE,
            crc,
            size,
            size,
            len(name_bytes),
            0,  # extra length
        )
        parts.append(lfh)
        parts.append(name_bytes)
        parts.append(entry.data)

        # Central Directory Record (46 bytes).
        cdr = struct.pack(
            "<IHHHHHHIIIHHHHHII",
            CDR_SIG,
            VERSION,     # version made by
            VERSION,     # version needed
            FLAGS,
            METHOD_STORED,
            MSDOS_EPOCH_TIME,
            MSDOS_EPOCH_DATE,
            crc,
            size,
            size,
            len(name_bytes),
            0,    # extra length
            0,    # comment length
            0,    # disk number
            0,    # internal attrs
            EXTERNAL_ATTR,
            offset,
        )
        cdr_parts.append(cdr)
        cdr_parts.append(name_bytes)

        offset += len(lfh) + len(name_bytes) + len(entry.data)

    cdr_start = offset
    cdr_blob = b"".join(cdr_parts)
    parts.append(cdr_blob)
    offset += len(cdr_blob)

    eocd = struct.pack(
        "<IHHHHIIH",
        EOCD_SIG,
        0,
        0,
        len(sorted_entries),
        len(sorted_entries),
        len(cdr_blob),
        cdr_start,
        0,
    )
    parts.append(eocd)

    return b"".join(parts)


def collect_entries(root_dir: str | Path, ignore: frozenset[str] = DEFAULT_IGNORE) -> list[ZipEntry]:
    """Walk the directory and return sorted entries suitable for pack_zip."""
    root = Path(root_dir).resolve()
    out: list[ZipEntry] = []

    def walk(d: Path) -> None:
        for child in sorted(d.iterdir(), key=lambda p: p.name):
            if child.name in ignore:
                continue
            if child.is_dir():
                walk(child)
            elif child.is_file():
                rel = child.relative_to(root).as_posix()
                out.append(ZipEntry(name=rel, data=child.read_bytes()))

    walk(root)
    out.sort(key=lambda e: e.name)
    return out


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()
