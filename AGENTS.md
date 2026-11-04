<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Commands

| Command                                        | What it does                                                                           |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| `pnpm dev`                                     | Dev server                                                                             |
| `pnpm typecheck` / `pnpm lint` / `pnpm format` | TS, ESLint (strict TS, jsx-a11y strict, Tailwind token rules), Prettier                |
| `pnpm test`                                    | Vitest unit tests (`**/*.test.ts(x)`, jsdom)                                           |
| `pnpm test:stories`                            | Every Storybook story as a test in Chromium, with axe a11y checks (violations fail)    |
| `pnpm storybook`                               | Component workshop / living design-system docs                                         |
| `pnpm build && pnpm e2e`                       | Playwright e2e, page-level axe (WCAG 2.2 AA), LCP/CLS budgets — against the prod build |
| `pnpm lhci`                                    | Lighthouse CI (needs `pnpm build` first)                                               |
| `pnpm verify`                                  | Fast gate: typecheck, lint, format check, unit + story tests                           |
| `pnpm verify:full`                             | `verify` + build + e2e + Lighthouse (what CI runs)                                     |

Run `pnpm verify` before saying a task is done.

## Design system rules

- Tokens live only in `app/globals.css` (CSS variables + `@theme inline`). Need a new colour, radius or font? Add a token there.
- Use semantic utilities (`bg-primary`, `text-muted-foreground`, `border-border`). Never raw palette colours (`bg-zinc-500`), hex, or arbitrary colour values (`bg-[#fff]`) — ESLint fails on them.
- `components/ui/` = shadcn primitives (Radix-based, added with `pnpm dlx shadcn@latest add <name>`). Compose them in `components/`; don't fork primitives unless necessary.
- Every new component needs a story in `stories/` covering its states; add a `play` test for interactive behaviour.
- Accessibility is a hard requirement: semantic HTML, labelled controls, keyboard support, visible focus. Story and e2e axe checks must pass.
- New routes: add them to `e2e/routes.ts` so they get axe and web-vitals checks.
