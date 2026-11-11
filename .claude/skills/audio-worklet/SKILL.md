---
name: audio-worklet
description: Web Audio and AudioWorklet rules for this project - one AudioContext and one shared AudioWorkletNode reused by every tool, suspend/resume instead of close, how a tool takes over the shared node, port messaging, the shared processor in public/worklets. Use before writing or debugging any AudioContext, AudioWorkletNode, store/audio-engine.ts, hooks that talk to the node, or public/worklets/processor.js.
---

# AudioWorklet

## One context, one node, shared by every tool

The tab has exactly **one** `AudioContext` and **one** `AudioWorkletNode`, created the first time any tool needs audio and kept until the page reloads. Beat machine, metronome, tuner and whatever comes next all reuse that node.

- `new AudioContext()` and `new AudioWorkletNode()` appear only in `store/audio-engine.ts`, and each runs once.
- No tool builds its own node. A tool that needs new DSP adds a **mode** to `public/worklets/processor.js` (today: `sequencer`, `pitch`), selected by a message.

## Suspend and resume, never close

`close()` is terminal. So the node's life is a cycle: `suspend()` when nothing plays, `resume()` when a tool starts.

Never:

- call `ctx.close()`
- disconnect the node from `ctx.destination` or set `workletNode` to `null`
- reset `status` to `"idle"` on unmount. The next mount would build a second context and node. `status` stays `"success"` for the life of the tab.

Suspend is tab-wide: `suspendAudio` refuses while `isRunning` is true. Stop first, then suspend. `stopAudio` must always clear `isRunning`, or suspend is blocked for the whole tab.

A context created outside a user gesture starts `suspended`. `resume()` only succeeds from a gesture handler, so it lives in the Start click path (`runAudio`), never in an effect.

## Init runs once per tab

`initAudio` is safe to call on every mount.

- Save `ctx` into the store **before** `await addModule()`. A failed `addModule` must not orphan a context.
- Concurrent callers share one in-flight promise (`initPromise`). Returning early on `status === "pending"` lets a second caller continue with `workletNode === null`.
- `addModule()` runs once per tab. The module URL and processor name (`/worklets/processor.js`, `audio-processor`) live in the store.

## A tool takes over the node on mount

The processor still holds the previous tool's grid, length, steps per beat and mode when a new tool mounts.

**Entering:**

1. `initAudio()`, a no-op after the first time.
2. `port.addEventListener("message", onMessage)`, then `port.start()`.
3. Send the tool's **full** config (mode, grid, length, steps per beat, bpm) every time. "Re-send only what changed" is wrong for a shared node.

**While mounted:** incremental messages (`UPDATE_GRID`, `SET_BPM`, `UPDATE_SPB`), `START` after `runAudio()`, `STOP` on stop.

**Leaving:** post `STOP`, then `stopAudio()` and `suspendAudio()`, then remove the listener. Input tools also disconnect the source and stop the `MediaStream` tracks. Leave the context, node, destination connection and `status` alone.

## Port messaging

- `addEventListener` / `removeEventListener` on the main thread, never `port.onmessage =`. The port serves the store and each tool in turn; `onmessage` is a single slot that tools would overwrite or clear for each other. (Inside the processor, `this.port.onmessage` is fine.)
- `addEventListener` does not start the port. Call `port.start()`. Messages posted before it are queued, not lost.
- Messages posted before the processor exists are queued, so config sent right after construction lands before any later `START`. No handshake needed.
- Don't drive config from `READY`. It is posted once per tab, so only the first tool would ever see it.

## Engine messages belong to the store

`AUTO_SUSPEND` is handled by the **store**, once, when it creates the node, so it works whichever tool is mounted. It suspends only when `isRunning` is false. The store also listens for `processorerror` and sets `status: "failure"`. The fix for that is the processor bug, not a rebuilt node.

Processor side:

- Post `AUTO_SUSPEND` once per idle period, not every quantum.
- `currentTime` stops while suspended, so a stale idle clock can re-suspend the tab right after `resume()`. Keep the idle clock reset on `START`/`STOP`.

## The store stays generic

The store owns `ctx`, `workletNode`, `status`, `isRunning`, init/run/stop/suspend and the `AUTO_SUSPEND` listener. It does **not** own tool payload types, `postMessage` of tool messages, tool listeners, or a tool's `MediaStream`. If a change only makes sense for one tool, it goes in that tool's hook (`hooks/useBeatMachine.ts`).

## Processor rules (`public/worklets/processor.js`)

Served raw: plain JS, no TypeScript, no `import`, no `@/` aliases.

- **Validate every payload.** An exception fires `processorerror` and kills the node for the whole tab until reload.
- `process()` runs about 375 times a second: no `console.log`, no per-sample allocation, hoist constants out of the loop, always `return true`.
- A mode switch or `INIT_GRID` must fully reset what the previous tool left: grid, length, steps per beat, step position, sample counter, active voices, pitch buffer.
- In `pitch` mode the outputs stay silent. The node is wired to the speakers, so copying input to output feeds back.
- Keep the protocol comment at the top of the file in sync with the `switch` in `handleMessage`.

## Input tools

The tuner feeds the mic into the shared node:

```ts
const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
const source = ctx.createMediaStreamSource(stream)
source.connect(workletNode)
```

On leave: `source.disconnect()` and `stream.getTracks().forEach((t) => t.stop())`. Without stopping the tracks the browser keeps showing the mic indicator. This is the one teardown allowed; the node stays.
