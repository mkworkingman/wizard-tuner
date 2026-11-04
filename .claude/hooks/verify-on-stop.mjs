// Stop hook: fast gate (typecheck + lint). On failure, exit 2 so the output is fed
// back to Claude and it keeps working. Full tests stay in `pnpm verify` / CI.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8"));
// Avoid infinite loops: if we already blocked once in this stop cycle, let it stop.
if (input.stop_hook_active) process.exit(0);

for (const script of ["typecheck", "lint"]) {
  const res = spawnSync("pnpm", ["-s", script], {
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (res.status !== 0) {
    process.stderr.write(`pnpm ${script} failed:\n${res.stdout}${res.stderr}`.slice(0, 8000));
    process.exit(2);
  }
}
