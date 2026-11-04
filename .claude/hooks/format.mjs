// PostToolUse hook: run Prettier on the file Claude just edited/wrote.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const FORMATTABLE = /\.(ts|tsx|js|jsx|mjs|mts|cjs|json|css|md|mdx|ya?ml)$/i;

const input = JSON.parse(readFileSync(0, "utf8"));
const file = input.tool_input?.file_path;

if (file && FORMATTABLE.test(file)) {
  const rel = path.relative(process.cwd(), file);
  if (!rel.startsWith("..") && !rel.includes("node_modules")) {
    try {
      execFileSync("pnpm", ["exec", "prettier", "--write", "--ignore-unknown", file], {
        stdio: "ignore",
        shell: process.platform === "win32",
      });
    } catch {
      // Formatting failures (e.g. syntax errors mid-edit) should not block the agent.
    }
  }
}
