// PreToolUse hook (Bash): reject commands that never exit or that run the wrong test project.
// Exit 2 sends stderr back to Claude as feedback.
import { readFileSync } from "node:fs"

const input = JSON.parse(readFileSync(0, "utf8"))
const command = input.tool_input?.command ?? ""

// Start of a command: beginning of the string or after a shell separator.
const START = String.raw`(?:^|[;&|(]\s*|\s)`

const RULES = [
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
