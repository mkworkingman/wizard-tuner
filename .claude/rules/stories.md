---
paths:
  - "stories/**"
---

# Story rules

Stories are for a human looking at Storybook. **A story earns its place only if it renders
something visibly different that no other story + controls already shows.** Fewer is better.

## Which stories

- One story per variant, plus one per state set by props or data (disabled, loading, error,
  empty, open, selected). Use `args` so controls work.
- Long content: don't add a separate story if a real long label fits naturally into a variant
  story. Real text, not "Lorem".
- A composition story (the component as the design uses it, e.g. a menu of buttons) is good: it's
  where a human hovers, presses and tabs through it.

**Don't create:**

- Hover / pressed / focus-visible / transition stories. A human checks pseudo-states by
  interacting. No forced-pseudo-state addons or tricks.
- Stories that only assert computed styles, token values, transition properties or class names.
- Stories for prop plumbing that looks identical (`asChild`, `className` merge, `data-slot`, ref).
- Variant × state matrix / "all variants" stories duplicating the individual stories.

## `play` functions

- `play` is for what a user does: click, keyboard path (Tab / Enter / Space / Esc / arrows), focus
  moves, disabled blocks interaction, callbacks fire (`fn()` from `storybook/test`). Query by role
  and name. Add it to an existing story; never create a story just to host assertions.
- `play` runs on load, so the canvas must look right AFTER it: initial state as designed (a
  disabled control stays disabled), nothing focused, no focus rings. Never leave a story mutated
  by its own test.
- Use `fireEvent.click`, not `userEvent.click`, unless the test is about keyboard/focus (e.g. the
  Menu story).

## Rules that apply to every story change

- axe runs automatically and violations fail. Don't disable rules to make a story pass; if a
  violation seems unavoidable, ask.
- Don't add unit tests that render and click. That belongs in a story `play`.
- When fixing a bug class (focus, state reset), grep ALL stories for it, not just the files you
  edited, and fix them in one pass.
- Before finishing, open every changed story in Storybook. If two look the same, delete one. If
  you didn't look at it, say so; passing tests don't prove the first-load appearance is correct.
