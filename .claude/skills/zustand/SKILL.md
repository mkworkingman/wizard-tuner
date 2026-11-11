---
name: zustand
description: Zustand store conventions for this project - export custom hooks not the raw store, atomic selectors and useShallow, the single `actions` object and its single hook, actions modelled as events. Use before writing or changing store/*, any hook that reads a store, or any component that subscribes to state.
---

# Zustand

This project is on **zustand v5**. Two facts drive the rules:

- Selectors run through `useSyncExternalStore`. A selector that returns a fresh object or array on every call can loop forever.
- `create` takes no equality function. Use `useShallow` from `zustand/shallow`.

## Export hooks, not the store

The raw store hook stays module-private. Only purpose-named hooks leave `store/`:

```ts
const useAudioEngineStore = create<AudioEngineState>()(...) // not exported

export const useWorkletNode = () => useAudioEngineStore((s) => s.workletNode)
export const useAudioStatus = () => useAudioEngineStore((s) => s.status)
export const useAudioActions = () => useAudioEngineStore((s) => s.actions)
```

Consumers never write selector literals, so renaming a field touches one hook body. **Never call a store hook with no selector.** It subscribes to the whole store. One hook per thing a consumer actually asks for, not one per field.

## Atomic selectors: the return value must be stable

The selector itself needn't be stable (no `useCallback`; the project runs `reactCompiler: true`). Its **result** is compared with `Object.is`. What breaks is building a new value each call:

```ts
// WRONG: new object every render
const { ctx, status } = useStore((s) => ({ ctx: s.ctx, status: s.status }))
```

Fix in this order: (1) atomic picks, one subscription per value; (2) `useShallow` when values travel together; (3) store the derived value if it is expensive. `useShallow` is shallow only. Derived data is computed in the hook or component, not stored.

## One `actions` object, one actions hook

All actions live in a nested `actions` object, exposed through one hook and destructured at the call site: `const { initAudio, runAudio } = useAudioActions()`.

This works because **`actions` is built once and never replaced by `set`**, so `(s) => s.actions` never changes identity and the functions are safe in `useEffect` deps. `hooks/useBeatMachine.ts` relies on that. Do none of these:

- `set(next, true)` (replace mode). It drops `actions`.
- Rebuild or spread `actions` inside an action.
- A "reset" action that restores a whole initial-state object. Reset state keys explicitly.
- `persist` without `partialize` excluding `actions`.

## Actions are events, not setters

An action names something that happened and owns the logic: guards, ordering, async and Web Audio calls. Components say what occurred; the store decides what it means.

```ts
// WRONG: component fires three sets
setStatus("success"); setIsRunning(true); setStartedAt(Date.now())

// RIGHT: one event, one transition, guards in the store
async runAudio() {
  const { ctx, status } = get()
  if (status !== "success") return
  if (ctx?.state === "suspended") await ctx.resume()
  set({ isRunning: true })
}
```

If a component reads state only to decide whether to act, move that decision into the action. A plain setter is fine for plain state (a controlled input's `setText`).

## Read without subscribing

Outside render (handlers, effects, callbacks) use `useAudioEngineStore.getState()` inside the store module, or move the read into the action. Subscribing to a value only to read it in a click handler re-renders for nothing.

## Keep the store generic

`store/audio-engine.ts` is the shared audio engine and must not learn about any one tool: no tool message types, config or listeners. See the `audio-worklet` skill for what may enter it.
