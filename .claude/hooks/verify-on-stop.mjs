// Stop hook: the `pnpm verify` gate (typecheck, lint, format check, unit tests, and story
// tests when UI code changed). On failure, exit 2 so the output is fed back to Claude and it
// keeps working. Story tests run Chromium, so they only run when stories or components changed.
import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"

const input = JSON.parse(readFileSync(0, "utf8"))
// Avoid infinite loops: if we already blocked once in this stop cycle, let it stop.
if (input.stop_hook_active) process.exit(0)

// Nothing changed (e.g. Claude only answered a question): skip the gate.
const status = spawnSync("git", ["status", "--porcelain", "-uall"], { encoding: "utf8" })
const changed = status.status === 0 ? status.stdout.trim() : ""
if (status.status === 0 && changed === "") process.exit(0)

// Paths that affect what stories render: stories, components (incl. route-private
// `_components`), global styles and Storybook config.
const UI_CHANGED =
  /(^|[\s/"])(stories|components|_components|\.storybook)\/|app\/globals\.css/m.test(changed)

const scripts = ["typecheck", "lint", "format:check", "test"]
if (UI_CHANGED) scripts.push("test:stories")

for (const script of scripts) {
  const res = spawnSync("pnpm", ["-s", script], {
    encoding: "utf8",
    shell: process.platform === "win32",
  })
  if (res.status !== 0) {
    process.stderr.write(`pnpm ${script} failed:\n${res.stdout}${res.stderr}`.slice(0, 8000))
    process.exit(2)
  }
}
