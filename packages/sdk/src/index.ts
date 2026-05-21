// Library API. The CLI is in cli.ts; this file re-exports the
// programmatic surfaces so other packages can `import { scaffold } from "@windy/drops-sdk"`.

export { scaffold } from "./lib/scaffold.js";
export type { ScaffoldOptions, ScaffoldResult } from "./lib/scaffold.js";
