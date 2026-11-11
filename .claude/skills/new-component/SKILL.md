---
name: new-component
description: Build a new UI component from a Figma design (or screenshot + specs) with shadcn/ui, Radix and Tailwind, mapped onto the existing design tokens, with Storybook stories per state, play tests and axe. Use when the user asks to create, build or implement a component, especially from a Figma link, frame or node.
---

# New component from Figma

AGENTS.md is the rulebook (tokens, 8px grid, folders, testing layers, a11y). This skill is the
workflow. Don't restate or relax AGENTS.md rules here; follow them.

One component per run. If the frame contains nested components that are not trivial, list them,
build the leaf ones first (each its own run), and say so.

## 0. Input

- Best: the Figma MCP (Dev Mode). Pull the design context, the variables (`get_variable_defs`)
  and a screenshot of the node.
- Fallback: a screenshot plus specs the user pastes. Ask for the values you can't read reliably
  (exact colours, spacing, font sizes).
- No Figma access and no screenshot → stop and ask. Don't build from a description alone.

Figma's generated code is a **reference only**. It uses absolute positioning, hex values and px
sizes that don't follow this system. Take the structure and intent from it, never the code.

## 1. Reuse check

Before writing anything:

1. Does `components/` already have it, or something a variant could cover? Extend it instead.
2. Is there a shadcn primitive for it? Check with `pnpm exec shadcn search` / `pnpm exec shadcn docs <name>`
   and add it with `pnpm dlx shadcn@latest add <name>`.
3. Compose primitives in `components/`. Don't edit `components/ui/`, unless Radix behaviour itself
   must change (say why in the PR).

Placement: shared → `components/<Name>.tsx` with a story. Used by one route only →
`app/<route>/_components/<Name>.tsx`. If unclear, ask. File names are PascalCase, matching the
exported component (`NavButton.tsx` → `NavButton`); see AGENTS.md for the exceptions.

## 2. States list (up front, before code)

Write out the states the design shows, then ask about each common one that's missing. Don't
invent its look:

default · hover · focus-visible · active/pressed · selected/checked · open/closed · disabled ·
loading · error/invalid · empty · long content (overflow, wrapping, truncation) · narrow viewport (if the design has breakpoints).

Skip the ones that can't apply (a static badge has no loading state). The confirmed list drives
the build. It is not a list of stories: step 5 decides which states get one (pseudo-states never
do).

## 3. Figma → tokens mapping (with a stop condition)

Tokens live in `app/globals.css`: `background`, `foreground`, and the per-tool families
(`tool-<name>`, `tool-<name>-surface`, `tool-<name>-hover`, `tool-foreground`). The app is dark-only
for now: `:root` holds the dark values and there is no light theme. Read the file; don't trust
this list if it's out of date. shadcn primitives expect the shadcn base tokens (`primary`,
`muted`, `border`, `ring`, …), which were removed: add the ones a primitive needs before using it.

Colours, in this order:

1. **By name.** If Figma uses variables, map them by semantic name/role to existing tokens.
2. **By value.** Otherwise convert to OKLCH and take the nearest token used in the same role
   (surface, text, border, accent). Compare with ΔE in OKLab:
   - < 0.02 → reuse.
   - 0.02 to 0.05 → reuse and list it under "substitutions" in the report.
   - > 0.05 → **stop**. Don't add tokens yourself.
3. **Stop condition.** When something has no match, collect every unmatched value for the
   component first, then propose the smallest set of new tokens that covers them. For each one
   give a semantic name (role, not colour: `success`, not `green`), its (dark) value, and
   where it's used. Wait for approval. Expect to propose 0, sometimes 1–2. If you need more than
   3, the design probably isn't using the system; say so.

Spacing and sizes: snap to the 8px grid (4px only where AGENTS.md allows it). List every snap of
more than 2px. Radius, font size, weight and shadow: map to the nearest existing Tailwind/token
step the same way. Icons: use the matching `lucide-react` icon, not an exported SVG. If none
matches closely, ask. Images: `next/image` with explicit size.

## 4. Build

- **Server Component by default.** Add `"use client"` only if this component itself has state,
  effects, event handlers or browser APIs. Rendering shadcn/Radix primitives (already client
  components) doesn't need it. Function props can't cross from Server to Client, so keep handlers
  in the client part. Docs: `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`.
- **API conventions:**
  - Variants via `cva`. Export the variants and use `VariantProps` for prop types.
  - `className` merged last with `cn` from `@/lib/utils`.
  - Spread the remaining props onto the root element. Type them as `React.ComponentProps<"el">` (or
    the primitive's props) plus your own.
  - `ref` is a normal prop (React 19). No `forwardRef`.
  - `data-slot="<name>"` on the root, like the shadcn primitives.
  - `asChild` (Radix `Slot`) when the root may need to be a link or another element.
  - Stateful components support both controlled and uncontrolled use, Radix-style:
    `value` / `defaultValue` / `onValueChange`.
  - Named exports. User-visible text comes from props or children, never hardcoded.
  - Non-visual logic (formatting, rules) goes in `lib/` with a unit test. The component stays thin.
- **Accessibility:** AGENTS.md and axe cover the general rules. Specific to this workflow:
  - Don't override Radix. Keep its roles, aria attributes, focus management and keyboard handling;
    style through `data-state` / `data-*` variants, not by replacing behaviour.
  - Never remove `focus-visible` styles (`outline-none` only alongside a visible ring).
  - Icon-only controls need a meaningful accessible name (axe only checks that one exists).
  - Animations respect `motion-reduce:`. Interactive targets are at least 24×24px.
  - If the design hides a focus ring, makes text too low-contrast or relies on colour alone, build
    it accessibly and list it as an intentional difference.

## 5. Stories (`stories/<Name>.stories.tsx`)

Read `.claude/rules/stories.md` first: it holds every story rule (which stories to write, `play`
conventions, axe, what not to create). It's the single source; don't restate it here.

Use the confirmed states list from step 2 to pick the stories. Before finishing, open every story
in Storybook (step 6).

## 6. Verify

1. `pnpm test:stories stories/<Name>.stories.tsx` while iterating.
2. `pnpm verify` before saying it's done. `pnpm verify:full` too if a route or layout changed, the
   component sits above the fold, or it uses fonts or images (LCP/CLS).
3. Visual compare: Storybook is started by the human (`pnpm storybook`, port 6006). Assume it's
   running. If it isn't reachable, ask; don't start it. Open each story with the chrome-devtools MCP
   (`http://localhost:6006/iframe.html?id=<story-id>&viewMode=story`), screenshot it at the
   Figma frame's width, and compare with the Figma screenshot. Fix differences that aren't
   intentional.

## 7. Report

End with:

- **Files**: created or changed.
- **Tokens**: reused (Figma value → token), substitutions with ΔE, new tokens proposed or added.
- **Grid snaps** of more than 2px.
- **States**: covered, and missing ones the user decided to skip.
- **Intentional differences from Figma** and why (grid, tokens, a11y).
- **Checks run** and their results (if something failed, show it).
- **Open questions.**
