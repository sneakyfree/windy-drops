#!/usr/bin/env bash
# tools/conformance/run.sh — schema conformance tests for windy.drop.v1.
#
# Runs every fixture in tools/conformance/fixtures/ against schemas/windy.drop.v1.json
# using BOTH ajv-cli (Node) and jsonschema (Python Draft 2020-12), and asserts the
# expected outcome based on the fixture's filename:
#
#   *.json          → must validate (VALID)
#   invalid-*.json  → must reject (INVALID)
#
# This script is the smoke gate for WD-0. WD-11 extends with byte-identity bundle
# comparison across the two SDKs.

set -euo pipefail

cd "$(dirname "$0")/../.."

SCHEMA="schemas/windy.drop.v1.json"
FIXTURES="tools/conformance/fixtures"

fail=0
pass=0

# --- Node / ajv-cli ---
echo ">>> ajv-cli (Node)"
for f in "$FIXTURES"/*.json; do
  name="$(basename "$f")"
  expected_valid=1
  case "$name" in
    invalid-*) expected_valid=0 ;;
  esac

  output="$(npx --yes -p ajv-cli@5 -p ajv-formats@3 ajv validate \
    -s "$SCHEMA" -d "$f" --spec=draft2020 -c ajv-formats 2>&1 || true)"

  if echo "$output" | grep -qE '(^| )invalid( |$)'; then
    actual_valid=0
  elif echo "$output" | grep -qE '(^| )valid( |$)'; then
    actual_valid=1
  else
    echo "  [ERROR] $name — unexpected ajv output:"
    echo "$output" | sed 's/^/    /'
    fail=$((fail+1))
    continue
  fi

  if [ "$expected_valid" = "$actual_valid" ]; then
    echo "  [PASS] $name"
    pass=$((pass+1))
  else
    echo "  [FAIL] $name — expected_valid=$expected_valid actual_valid=$actual_valid"
    echo "$output" | sed 's/^/    /'
    fail=$((fail+1))
  fi
done

# --- Python / jsonschema ---
echo ""
echo ">>> jsonschema (Python Draft 2020-12)"
if command -v uvx >/dev/null 2>&1; then
  PY_RUNNER='uvx --with jsonschema python3'
else
  PY_RUNNER='python3'
fi

for f in "$FIXTURES"/*.json; do
  name="$(basename "$f")"
  expected_valid=1
  case "$name" in
    invalid-*) expected_valid=0 ;;
  esac

  if $PY_RUNNER - "$SCHEMA" "$f" <<'PY' 2>/dev/null
import json, sys
import jsonschema
schema = json.load(open(sys.argv[1]))
data = json.load(open(sys.argv[2]))
try:
    jsonschema.Draft202012Validator(schema).validate(data)
    sys.exit(0)  # VALID
except jsonschema.ValidationError:
    sys.exit(2)  # INVALID
PY
  then
    actual_valid=1
  else
    rc=$?
    if [ "$rc" = "2" ]; then
      actual_valid=0
    else
      echo "  [ERROR] $name — Python validator crashed (exit $rc)"
      fail=$((fail+1))
      continue
    fi
  fi

  if [ "$expected_valid" = "$actual_valid" ]; then
    echo "  [PASS] $name"
    pass=$((pass+1))
  else
    echo "  [FAIL] $name — expected_valid=$expected_valid actual_valid=$actual_valid"
    fail=$((fail+1))
  fi
done

echo ""
echo "—— $pass passed, $fail failed ——"
exit "$fail"
