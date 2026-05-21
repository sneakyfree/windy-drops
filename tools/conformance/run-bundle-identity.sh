#!/usr/bin/env bash
# tools/conformance/run-bundle-identity.sh — WD-11 conformance harness.
#
# Runs both SDKs (TS + Python) against every example scaffold and asserts the
# resulting .zip bytes are identical. This is the critical-path acceptance
# criterion #8 of ADR-053:
#
#   "A drop published from either SDK is byte-identical on R2."
#
# Fails if any divergence surfaces. The TS SDK must be built first
# (`npm install && npm run build` in packages/sdk/) and the Python SDK must be
# installed in a venv (`uv venv && uv pip install -e .` from python/sdk/).

set -euo pipefail

cd "$(dirname "$0")/../.."

TS_CLI="node packages/sdk/bin/windy-drops"
PY_CLI="python/sdk/.venv/bin/windy-drops"

if [ ! -f packages/sdk/dist/cli.js ]; then
  echo "FAIL: TS SDK not built. Run: cd packages/sdk && npm install && npm run build"
  exit 1
fi
if [ ! -x "$PY_CLI" ]; then
  echo "FAIL: Python SDK not installed. Run: cd python/sdk && uv venv && uv pip install -e ../artifact-spec -e ."
  exit 1
fi

WORK="$(mktemp -d -t wd-conformance-XXXXXX)"
trap 'rm -rf "$WORK"' EXIT

fail=0
pass=0

for example in examples/*-minimal; do
  type="$(basename "$example" -minimal)"
  drop="$WORK/$type"
  cp -r "$example" "$drop"

  # Bundle with both SDKs.
  $TS_CLI bundle "$drop" --out "$WORK/ts-$type" > /dev/null
  $PY_CLI bundle "$drop" --out "$WORK/py-$type" > /dev/null

  ts_zip="$WORK/ts-$type.zip"
  py_zip="$WORK/py-$type.zip"

  if cmp -s "$ts_zip" "$py_zip"; then
    ts_size="$(wc -c < "$ts_zip")"
    echo "  [PASS] $type (size: $ts_size bytes)"
    pass=$((pass + 1))
  else
    echo "  [FAIL] $type — TS and Py zips differ"
    echo "    TS: $(wc -c < "$ts_zip") bytes, sha256 $(shasum -a 256 "$ts_zip" | awk '{print $1}')"
    echo "    Py: $(wc -c < "$py_zip") bytes, sha256 $(shasum -a 256 "$py_zip" | awk '{print $1}')"
    fail=$((fail + 1))
  fi
done

echo ""
echo "—— WD-11 cross-SDK byte-identity: $pass pass, $fail fail ——"
exit "$fail"
