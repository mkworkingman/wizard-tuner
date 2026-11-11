<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Commands

| Command                                        | What it does                                                                           |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| `pnpm dev` / `pnpm storybook`                  | Dev server / component workshop — long-running, human only (see below)                 |
| `pnpm typecheck` / `pnpm lint` / `pnpm format` | TS, ESLint (strict TS, jsx-a11y strict, Tailwind token rules), Prettier                |
| `pnpm test`                                    | Vitest unit tests (`**/*.test.ts(x)`, jsdom)                                           |
| `pnpm test:stories`                            | Every Storybook story as a test in Chromium, with axe a11y checks (violations fail)    |
| `pnpm build && pnpm e2e`                       | Playwright e2e, page-level axe (WCAG 2.2 AA), LCP/CLS budgets — against the prod build |
| `pnpm verify`                                  | Fast gate: typecheck, lint, format check, unit + story tests                           |
| `pnpm verify:full`                             | `verify` + build + e2e + Lighthouse (what CI runs)                                     |

Run a single target while iterating instead of the whole suite (extra args pass through to the script):

- One unit test file: `pnpm test lib/utils.test.ts`
- One story file: `pnpm test:stories stories/Button.stories.tsx`
- One e2e spec: `pnpm build && pnpm e2e e2e/smoke.spec.ts` — Playwright only runs `pnpm start`, it never builds, so skipping `pnpm build` tests a stale build.

Don't use bare `pnpm vitest run <path>` — without `--project` it runs both the unit and storybook projects.

`pnpm dev` and `pnpm storybook` never exit. Don't start them unless asked; assume they're already running if you need them.

When to verify:

- A Stop hook (`.claude/hooks/verify-on-stop.mjs`) runs typecheck, lint, format check and unit tests whenever the working tree has changes. You still run `pnpm verify` (adds story tests) before saying a task is done.
- Run `pnpm verify:full` when touching routes, layouts, fonts/images, anything affecting LCP/CLS, or anything that changes the e2e flows.

## Where code goes

- `app/` — routes, layouts and pages (App Router). Route-private components go in a `_components/` folder next to the route that uses them (e.g. `app/_components/WebVitals.tsx` for the root layout).
- `components/` — shared, reusable components composed from `components/ui/` primitives. Each one gets a story in `stories/`.
- **Component file names are PascalCase and match the exported component:** `components/NavButton.tsx` exports `NavButton`, with its story in `stories/NavButton.stories.tsx`. This applies to new components in `components/` and `_components/` folders. Exceptions: `components/ui/` (shadcn CLI output stays kebab-case), Next.js special files (`page.tsx`, `layout.tsx`, …), and non-component modules (`lib/`, `actions.ts`, `fonts.ts`). `data-slot` values stay kebab-case (`data-slot="nav-button"`).
- Data fetching happens in Server Components; server actions go in an `actions.ts` file next to the route that uses them.
- `lib/` — framework-agnostic logic (validation, formatting, wizard step rules, helpers like `cn`), unit-tested with a `*.test.ts` file alongside.

## Design system rules

- Tokens live only in `app/globals.css` (CSS variables + `@theme inline`). Need a new colour, radius or font? Add a token there.
- Use semantic utilities (`bg-primary`, `text-muted-foreground`, `border-border`). Never raw palette colours (`bg-zinc-500`), hex, or arbitrary colour values (`bg-[#fff]`) — ESLint fails on them.
- **8px grid:** spacing and sizes (padding, margin, gap, width/height, position) are multiples of 8px = 0.5rem. Tailwind's scale is 0.25rem (4px) per step, so use even steps: `p-2` (8px), `gap-4` (16px), `h-10` (40px).
- 4px (0.25rem: `p-1`, `gap-1`) is allowed, but avoid it. Use it only where 8px is clearly too loose, e.g. an icon next to text or badge padding.
- Nothing else off the grid: no odd steps above 1 (`p-3`, `h-5`), no half steps (`gap-1.5`), no arbitrary px (`w-[13px]`). ESLint fails on them.
- Exception: 1–2px for borders, outlines, focus rings, shadows and other effects (`border`, `border-2`, `ring-2`, `h-px`).
- Hand-written CSS uses rem in multiples of 0.5rem; px only for the 1–2px exceptions.
- **No duplicated styling.** Before writing a class recipe, check `app/globals.css` for a utility that already does it, and use that. If the same recipe (3+ utilities doing one job) appears in a second place, extract it: a `@utility` in `app/globals.css` for a single-purpose style, or a `cva` variant for a component. Example: every focusable element uses `focus-ring`; never hand-write `outline-*` / `focus-visible:outline-*` classes.
- **Transitions are 200ms.** `--default-transition-duration` in `app/globals.css` sets this for every `transition*` utility, so don't add `duration-*` classes. Hand-written CSS uses `var(--default-transition-duration)`.
- `components/ui/` = shadcn primitives (Radix-based, added with `pnpm dlx shadcn@latest add <name>`). Compose them in `components/`. Extend primitives via `className` and `cva` variants; edit a file in `components/ui/` only if Radix behaviour itself must change, and say why in the PR.
- Every new component needs stories in `stories/`: one per variant and per prop-driven state (disabled, loading, error, open, …). Each story must look different from every other one. No stories for hover/pressed/focus-visible/transitions, prop plumbing (`asChild`) or variant matrices; a human checks pseudo-states by interacting.
- Accessibility is a hard requirement: semantic HTML, labelled controls, keyboard support, visible focus. Story and e2e axe checks must pass.
- New routes: add them to `e2e/routes.ts` so they get axe and web-vitals checks.

## Testing rules

Each layer owns one job — don't duplicate coverage across them.

- **Story `play` tests** (`pnpm test:stories`, real Chromium + axe): what a user does — clicks, keyboard, focus moves, open/closed, disabled blocks interaction, callbacks. Add `play` to an existing story; don't create a story just to host assertions, and don't assert computed styles or class names.
- **Unit tests** (`pnpm test`, jsdom): non-visual logic only — hooks, reducers, validation, formatting, wizard step rules. Don't render-and-click components here; that belongs in a story.
- **E2E** (`pnpm e2e`): a few critical cross-page user flows plus page-level axe and web-vitals budgets. Don't test component variants here.

## TypeScript

- Use `type`, not `interface`. Only use `interface` to augment an existing global interface (e.g. `Window` inside `declare global`). ESLint enforces this; the global augmentation needs a one-line `eslint-disable-next-line @typescript-eslint/consistent-type-definitions` with a reason.

## Audio

- One `AudioContext` and one `AudioWorkletNode` per tab, shared by every tool. They live in `store/audio-engine.ts` and nowhere else. Tools never build their own node; new DSP is a new mode in `public/worklets/processor.js`.
- Before touching `store/audio-engine.ts`, `public/worklets/processor.js` or any hook that posts to the node (e.g. `hooks/useBeatMachine.ts`), invoke the `audio-worklet` skill. Before changing any zustand store or a component that reads one, invoke the `zustand` skill.

## Working rules

- If a request has two plausible readings, state the one I'm taking in a sentence and ask before editing when the readings lead to different code. After a correction, re-read the whole original message instead of flipping to the opposite extreme.
- Storybook `play` functions run on load, so the canvas must look right AFTER play: initial state as designed (e.g. disabled stays disabled), nothing focused, no focus rings. Use `fireEvent.click` instead of `userEvent.click` unless the test is about keyboard/focus (e.g. the Menu story). Never leave a story mutated by its own test.
- When fixing a bug class (focus, state reset), grep ALL stories for it, not just the files I edited, and fix them in one pass.
- Say plainly that I have not looked at it in Storybook/browser unless I did. Passing tests do not prove the first-load appearance is correct.
- If the user names an element I can't find in the code, say so and ask. Don't guess.
- Keep replies short: what changed, what's unverified, one question if needed.
