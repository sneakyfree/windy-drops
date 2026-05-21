// Library API. The CLI is in cli.ts; this file re-exports the
// programmatic surfaces so other packages can `import { scaffold } from "@windy/drops-sdk"`.

export { scaffold } from "./lib/scaffold.js";
export type { ScaffoldOptions, ScaffoldResult } from "./lib/scaffold.js";
export { validate } from "./commands/validate.js";
export type { ValidateOptions, ValidateResult, ValidateError } from "./commands/validate.js";
export { readSkillMd, SkillMdError } from "./lib/skill-md.js";
export type { ParsedSkillMd } from "./lib/skill-md.js";
