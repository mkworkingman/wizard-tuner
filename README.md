# Wizard Tuner

A browser toolkit for musicians: tuner, ear training, metronome and beat machine.
Built with Next.js (App Router), React, Tailwind CSS v4, shadcn/ui (Radix) and the Web Audio API.

## Getting started

Requires Node 24 and pnpm (version pinned in `package.json`).

```bash
pnpm install   # also enables the git pre-commit hook
pnpm dev       # http://localhost:3000
pnpm storybook # http://localhost:6006
```

## Scripts

| Command                  | What it does                                                                |
| ------------------------ | --------------------------------------------------------------------------- |
| `pnpm verify`            | Typecheck, lint, format check, unit tests, story tests (runs on pre-commit) |
| `pnpm verify:full`       | `verify` + build + Playwright e2e + Lighthouse (what CI runs)               |
| `pnpm test`              | Unit tests (Vitest, jsdom)                                                  |
| `pnpm test:stories`      | Every Storybook story in Chromium, with axe a11y checks                     |
| `pnpm build && pnpm e2e` | E2E, page-level axe and web-vitals budgets against the production build     |

## Documentation

- [`AGENTS.md`](AGENTS.md): conventions for contributors and coding agents (design system rules, testing layers, where code goes). Read this first.
- [`docs/architecture.md`](docs/architecture.md): project layout and the shared audio engine.
