// Stop hook: the `pnpm verify` gate (typecheck, lint, format check, unit tests, and story
// tests when UI code changed). On the first failure, exit 2 so the output is fed back to
// Claude. If it still fails on the retry (stop_hook_active), stop but show a systemMessage so
// the red checks are not silent. A green run is cached by a hash of the working-tree changes,
// so turns that changed nothing since the last green run skip the gate.
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

const input = JSON.parse(readFileSync(0, "utf8"))
const root = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd()
const git = (...args) => spawnSync("git", args, { encoding: "utf8", cwd: root })

const status = git("status", "--porcelain", "-uall")
const changed = status.status === 0 ? status.stdout.trim() : ""
// Nothing changed (e.g. Claude only answered a question): skip the gate.
if (status.status === 0 && changed === "") process.exit(0)

// Hash tracked diff + untracked file contents.
const hash = createHash("sha256")
hash.update(git("diff", "HEAD").stdout)
for (const line of changed.split("\n")) {
  if (!line.startsWith("??")) continue
  const file = path.join(root, line.slice(3).replace(/^"|"$/g, ""))
  hash.update(line)
  if (existsSync(file)) hash.update(readFileSync(file))
}
const digest = hash.digest("hex")
const cache = path.join(
  tmpdir(),
  `claude-verify-${createHash("sha1").update(root).digest("hex").slice(0, 12)}`,
)
if (existsSync(cache) && readFileSync(cache, "utf8") === digest) process.exit(0)

// Paths that affect what stories render: stories, components (incl. route-private
// `_components`), hooks and lib (stories import them), global styles and Storybook config.
const UI_CHANGED =
  /(^|[\s/"])(stories|components|_components|hooks|lib|\.storybook)\/|app\/globals\.css/m.test(
    changed,
  )

const scripts = ["typecheck", "lint", "format:check", "test"]
if (UI_CHANGED) scripts.push("test:stories")

for (const script of scripts) {
  const res = spawnSync("pnpm", ["-s", script], {
    encoding: "utf8",
    cwd: root,
    shell: process.platform === "win32",
  })
  if (res.status !== 0) {
    const report = `pnpm ${script} failed:\n${res.stdout}${res.stderr}`.slice(0, 8000)
    if (input.stop_hook_active) {
      // Already retried once: don't loop, but make the failure visible.
      process.stdout.write(
        JSON.stringify({ systemMessage: `Verify gate still failing after retry.\n${report}` }),
      )
      process.exit(0)
    }
    process.stderr.write(report)
    process.exit(2)
  }
}
writeFileSync(cache, digest)
