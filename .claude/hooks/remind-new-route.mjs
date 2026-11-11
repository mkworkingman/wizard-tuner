// PostToolUse hook (Write): when an app/**/page.tsx exists whose URL is missing from
// e2e/routes.ts, remind Claude to register it. Exit 2 feeds stderr back to Claude.
import { readFileSync } from "node:fs"
import path from "node:path"

const input = JSON.parse(readFileSync(0, "utf8"))
const file = input.tool_input?.file_path
if (!file) process.exit(0)

const rel = path.relative(process.cwd(), file).split(path.sep).join("/")
if (!/^app\/(?:.+\/)?page\.tsx$/.test(rel)) process.exit(0)

// URL = path segments minus `app`, route groups `(group)` and `page.tsx`.
const segments = rel.split("/").slice(1, -1)
const url = "/" + segments.filter((s) => !s.startsWith("(")).join("/")

let routes = ""
try {
  routes = readFileSync(path.join(process.cwd(), "e2e", "routes.ts"), "utf8")
} catch {
  // No routes file: fall through and remind.
}
if (routes.includes(`"${url}"`)) process.exit(0)

process.stderr.write(
  `New route ${url}: add it to e2e/routes.ts, and run \`pnpm verify:full\` before you finish.\n`,
)
process.exit(2)
