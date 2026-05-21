// chalk-shim.ts — tiny ANSI color helper. Avoids pulling in chalk as a
// runtime dependency (the SDK's command output is minimal). Honors NO_COLOR
// and detects TTY.

const enabled =
  !process.env.NO_COLOR &&
  process.stdout.isTTY !== false &&
  process.env.TERM !== "dumb";

function wrap(open: number, close: number) {
  return (s: string) => (enabled ? `\x1b[${open}m${s}\x1b[${close}m` : s);
}

export default {
  green: wrap(32, 39),
  red: wrap(31, 39),
  yellow: wrap(33, 39),
  cyan: wrap(36, 39),
  dim: wrap(2, 22),
  bold: wrap(1, 22),
};
