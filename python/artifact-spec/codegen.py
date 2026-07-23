#!/usr/bin/env python3
"""codegen.py — WD-2: Regenerate src/windy_drops_spec/__init__.py from
schemas/windy.drop.v1.json via datamodel-code-generator (Pydantic v2 target).

CI re-runs this on every PR and fails if the generated file is stale relative to
the schema (see .github/workflows/ci.yml).

Usage:
    uvx --with 'datamodel-code-generator==0.70.0' python codegen.py

The generator version is pinned (here, in pyproject.toml [codegen], and in
ci.yml) because its output format drifts across releases, which would fail
the CI staleness check without any schema change.
"""

from __future__ import annotations

import sys
from pathlib import Path
from datamodel_code_generator import DataModelType, InputFileType, PythonVersion, generate

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
SCHEMA = ROOT / "schemas" / "windy.drop.v1.json"
OUTPUT = HERE / "src" / "windy_drops_spec" / "_generated.py"


def main() -> int:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    generate(
        input_=SCHEMA,
        input_file_type=InputFileType.JsonSchema,
        output=OUTPUT,
        output_model_type=DataModelType.PydanticV2BaseModel,
        target_python_version=PythonVersion.PY_311,  # min supported per pyproject.toml
        class_name="DropManifest",
        use_double_quotes=True,
        use_schema_description=True,
        use_field_description=True,
        field_constraints=True,
        snake_case_field=False,
        use_standard_collections=True,
        use_union_operator=True,
        collapse_root_models=True,
        disable_timestamp=True,
        custom_file_header=(
            "# GENERATED FILE. DO NOT EDIT.\n"
            "# Run `uvx --with 'datamodel-code-generator==0.70.0' python codegen.py`\n"
            "# from python/artifact-spec/ to regenerate.\n"
            "# Source: schemas/windy.drop.v1.json (WD-0 of DNA_STRAND_MASTER_PLAN.md).\n"
            "#\n"
            "# This file ships in the windy-drops-spec package on PyPI. Both this\n"
            "# binding and the TypeScript sibling (@windy/drops-artifact-spec on npm)\n"
            "# are codegen'd from the same JSON Schema. A manifest accepted by one\n"
            "# MUST be accepted by the other (enforced by WD-11 conformance harness).\n"
        ),
    )

    print(f"Wrote {OUTPUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
