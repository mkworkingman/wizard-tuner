---
name: verify
description: Run the project's verification gate before committing or declaring a task done. Use before every commit and when finishing a task.
---

# Verify

1. Run `pnpm verify` (typecheck, lint, format check, unit + story tests). Fix failures; don't edit tests or lint config to make them pass.
2. If the change touched routes, layouts, fonts/images, LCP/CLS-relevant code or e2e flows, also run `pnpm verify:full`.
3. Report the commands run and their result. If something fails or was skipped, say so.
