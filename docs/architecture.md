# Architecture

## Layout

| Path               | Contents                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `app/`             | Routes and layouts. Tool pages live under `app/(tools)/`.                   |
| `components/`      | Shared components built from `components/ui/` (shadcn) primitives.          |
| `stories/`         | Storybook stories; each is also a Chromium test with axe checks.            |
| `store/`           | Zustand stores, including the shared audio engine.                          |
| `hooks/`           | React hooks, e.g. `useBeatMachine`.                                         |
| `lib/`             | Framework-agnostic logic, unit-tested alongside.                            |
| `e2e/`             | Playwright flows, a11y and web-vitals checks. Routes listed in `routes.ts`. |
| `public/worklets/` | AudioWorklet processor code.                                                |

## Audio engine

Every tool shares one `AudioContext` and one `AudioWorkletNode` per tab, owned by
`store/audio-engine.ts`. Tools never create their own node. New DSP is added as a new mode
in `public/worklets/processor.js`, and tools talk to the node over its message port
(see `hooks/useBeatMachine.ts`).

## Quality gates

| Layer         | Where                      | Owns                                       |
| ------------- | -------------------------- | ------------------------------------------ |
| Pre-commit    | `.githooks/pre-commit`     | `pnpm verify`                              |
| Agent session | `.claude/hooks/`           | format on edit, verify on stop, bash guard |
| CI            | `.github/workflows/ci.yml` | `pnpm verify:full` on PRs and `main`       |
| Dependencies  | `.github/dependabot.yml`   | Weekly grouped update PRs                  |
