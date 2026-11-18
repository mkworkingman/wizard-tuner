---
paths:
  - "store/audio-engine.ts"
  - "public/worklets/**"
  - "hooks/**"
---

# Audio rules

Before editing this file, invoke the `audio-worklet` skill (once per session or after compaction).

- One `AudioContext` and one `AudioWorkletNode` per tab, owned by `store/audio-engine.ts`.
- Tools never create their own node; new DSP is a new mode in `public/worklets/processor.js`.
- Keep the protocol comment in `processor.js` in sync with its `handleMessage` switch.
