"""windy_drops — Python SDK for publishing drops to the Windy Drops registry.

The CLI entry point is `windy-drops`; library API re-exports the
scaffold / validate / bundle / sign / publish / fork helpers so other
Python packages can use the SDK programmatically.

Strand: WD-4..WD-10 of docs/DNA_STRAND_MASTER_PLAN.md.
"""

from __future__ import annotations

from .commands.validate import ValidateError, ValidateResult, validate
from .lib.scaffold import RESERVED_DROP_TYPES, ScaffoldResult, scaffold
from .lib.skill_md import ParsedSkillMd, SkillMdError, read_skill_md

__all__ = [
    "scaffold",
    "ScaffoldResult",
    "RESERVED_DROP_TYPES",
    "validate",
    "ValidateResult",
    "ValidateError",
    "read_skill_md",
    "ParsedSkillMd",
    "SkillMdError",
]
