// PreToolUse hook (Edit|Write|MultiEdit): before touching audio or zustand files, remind Claude
// to invoke the matching skill. Non-blocking (exit 0 + additionalContext), and at most once per
// skill per session so it doesn't nag on every edit.
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

const input = JSON.parse(readFileSync(0, "utf8"))
const file = input.tool_input?.file_path
if (!file) process.exit(0)

const rel = path.relative(process.cwd(), file).split(path.sep).join("/")
if (/\.test\.tsx?$/.test(rel)) process.exit(0)

const RULES = [
  {
    skill: "audio-worklet",
    test: /^(store\/audio-engine\.ts|public\/worklets\/processor\.js|hooks\/useBeatMachine\.ts)$/,
  },
  { skill: "zustand", test: /^store\/.+\.tsx?$/ },
]

const skills = RULES.filter((r) => r.test.test(rel))
  .map((r) => r.skill)
  .filter((skill) => {
    const marker = path.join(tmpdir(), `claude-skill-${String(input.session_id)}-${skill}`)
    if (existsSync(marker)) return false
    writeFileSync(marker, "")
    return true
  })
if (skills.length === 0) process.exit(0)

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      additionalContext: `AGENTS.md: ${rel} requires the ${skills.join(" and ")} skill${skills.length > 1 ? "s" : ""}. If you have not invoked ${skills.length > 1 ? "them" : "it"} this session, do so before editing.`,
    },
  }),
)
