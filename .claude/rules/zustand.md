---
paths:
  - "store/**"
  - "hooks/**"
---

# Zustand rules

Before editing this file, invoke the `zustand` skill (once per session or after compaction).

- The raw store stays module-private; export purpose-named hooks only.
- Never call a store hook without a selector; selector results must be stable (`useShallow` for objects).
- State changes go through the single `actions` object, modelled as events.
- Applies to components that read a store too, even though they are outside these paths.
