// PreToolUse hook (Bash): reject commands that never exit or that run the wrong test project.
// Exit 2 sends stderr back to Claude as feedback.
import { readFileSync } from "node:fs"

const input = JSON.parse(readFileSync(0, "utf8"))
const raw = input.tool_input?.command ?? ""
// Match on the command with quoted strings blanked out, so `grep "next dev"` is not blocked.
const command = raw.replace(/"(?:[^"\\]|\\.)*"|'[^']*'/g, '""')

// Start of a command: beginning of the string or after a shell separator.
const START = String.raw`(?:^|[;&|(]\s*|\s)`

const RULES = [
  {
    test: /\bgit\s+commit\b[^;&|]*(?:--no-verify\b|\s-[a-zA-Z]*n[a-zA-Z]*(?:\s|$))/,
    message: "Blocked: never skip the pre-commit gate (--no-verify / -n). Fix the failing check.",
  },
  {
    test: new RegExp(`${START}(?:cat|type|less|more|head|tail|bat)\\s[^;&|]*\\.env\\b`),
    message: "Blocked: .env files are off limits.",
  },
  {
    test: new RegExp(
      `${START}(?:pnpm\\s+(?:run\\s+)?(?:dev|storybook|test:watch)|(?:pnpm\\s+exec\\s+|npx\\s+)?next\\s+dev|(?:pnpm\\s+exec\\s+|npx\\s+)?storybook\\s+dev)(?:\\s|$|[;&|)])`,
    ),
    message:
      "Blocked: dev server, Storybook and watch mode never exit. The human runs them; assume they are already running.",
  },
  {
    // Any direct vitest call without --project would run both the unit and storybook projects.
    test: (cmd) =>
      new RegExp(`${START}(?:pnpm\\s+(?:exec\\s+)?|npx\\s+)vitest(?:\\s|$)`).test(cmd) &&
      !/--project\b/.test(cmd),
    message:
      "Blocked: bare vitest runs both projects. Use `pnpm test <file>` (unit) or `pnpm test:stories <file>` (stories).",
  },
]

for (const { test, message } of RULES) {
  const hit = typeof test === "function" ? test(command) : test.test(command)
  if (hit) {
    process.stderr.write(`${message}\n`)
    process.exit(2)
  }
}
