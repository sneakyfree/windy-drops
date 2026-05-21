// canonical.ts — deterministic JSON serialization for signing.
//
// Mirrored exactly by python/sdk/src/windy_drops/lib/canonical.py:
//   recursive lexicographic key sort, compact separators, no whitespace.
//
// Used to derive the bytes signed by `windy-drops sign` so the signature
// is reproducible from either SDK (and verifiable by the registry).

export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalize).join(",") + "]";
  }
  const keys = Object.keys(value as Record<string, unknown>).sort();
  const parts = keys.map((k) => {
    return JSON.stringify(k) + ":" + canonicalize((value as Record<string, unknown>)[k]);
  });
  return "{" + parts.join(",") + "}";
}
