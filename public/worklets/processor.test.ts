import { readFileSync } from "node:fs"
import path from "node:path"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const SAMPLE_RATE = 48000
const QUANTUM = 128

type Message = { type: string; payload?: unknown; step?: number }
type Processor = {
  port: {
    postMessage: ReturnType<typeof vi.fn<(m: Message, transfer?: unknown[]) => void>>
    onmessage: (e: { data: unknown }) => void
  }
  process: (inputs: Float32Array[][], outputs: Float32Array[][]) => boolean
  grid: Record<string, number[]>
  totalSteps: number
  stepsPerBeat: number
  bpm: number
  mode: string
  isPlaying: boolean
  activeVoices: unknown[]
  currentStep: number
  pitchBufferFill: number
}

let Ctor: new () => Processor

// The worklet is plain JS served raw, so run it the way the browser would: with the
// AudioWorkletGlobalScope globals stubbed, and read it back through registerProcessor.
function loadProcessor() {
  vi.stubGlobal("sampleRate", SAMPLE_RATE)
  vi.stubGlobal("currentTime", 0)
  vi.stubGlobal(
    "AudioWorkletProcessor",
    class {
      port = { postMessage: vi.fn(), onmessage: null }
    },
  )
  vi.stubGlobal("registerProcessor", (_name: string, cls: new () => Processor) => {
    Ctor = cls
  })
  const source = readFileSync(path.join(__dirname, "processor.js"), "utf8")
  // The worklet scope has no module system: evaluating the raw source is the faithful way to load it.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval, @typescript-eslint/no-unsafe-call
  new Function(source)()
}

const ones = (n: number) => Array.from({ length: n }, () => 1)
const setTime = (t: number) => vi.stubGlobal("currentTime", t)

function send(proc: Processor, data: unknown) {
  proc.port.onmessage({ data })
}

const posted = (proc: Processor) => proc.port.postMessage.mock.calls.map((c) => c[0])
const ofType = (proc: Processor, type: string) => posted(proc).filter((m) => m.type === type)

function runQuantum(proc: Processor, input?: Float32Array) {
  const output = new Float32Array(QUANTUM)
  const result = proc.process(input ? [[input]] : [[]], [[output]])
  return { output, result }
}

function sequencer(proc: Processor, grid: Record<string, number[]>, bpm = 120, spb = 4) {
  send(proc, {
    type: "INIT_GRID",
    payload: { grid, gridLength: 16, stepsPerBeat: spb },
  })
  send(proc, { type: "SET_BPM", payload: bpm })
}

describe("audio processor", () => {
  let proc: Processor

  beforeEach(() => {
    loadProcessor()
    proc = new Ctor()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("posts READY once when created", () => {
    expect(ofType(proc, "READY")).toHaveLength(1)
  })

  describe("payload validation", () => {
    it("ignores malformed messages without throwing", () => {
      const bad = [
        null,
        undefined,
        42,
        "x",
        {},
        { type: "NOPE" },
        { type: "INIT_GRID" },
        { type: "INIT_GRID", payload: null },
        { type: "INIT_GRID", payload: { grid: null, gridLength: 16, stepsPerBeat: 4 } },
        { type: "INIT_GRID", payload: { grid: {}, gridLength: 0, stepsPerBeat: 4 } },
        { type: "INIT_GRID", payload: { grid: {}, gridLength: 1.5, stepsPerBeat: 4 } },
        { type: "INIT_GRID", payload: { grid: {}, gridLength: 16, stepsPerBeat: 0 } },
        { type: "UPDATE_GRID" },
        { type: "UPDATE_GRID", payload: { instrument: "kick", step: -1, value: 1 } },
        { type: "UPDATE_SPB", payload: "4" },
        { type: "SET_BPM", payload: NaN },
        { type: "SET_BPM", payload: -5 },
        { type: "SET_MODE", payload: "reverb" },
      ]
      for (const data of bad)
        expect(() => {
          send(proc, data)
        }).not.toThrow()
      expect(proc.mode).toBe("sequencer")
      expect(proc.bpm).toBe(120)
      expect(proc.totalSteps).toBe(0)
    })

    it("only accepts own instrument names, not inherited object keys", () => {
      send(proc, {
        type: "INIT_GRID",
        payload: {
          grid: { kick: [1], constructor: [1], toString: [1], __proto__: [1] },
          gridLength: 16,
          stepsPerBeat: 4,
        },
      })
      expect(Object.keys(proc.grid)).toEqual(["kick"])

      send(proc, { type: "UPDATE_GRID", payload: { instrument: "toString", step: 0, value: 1 } })
      send(proc, { type: "UPDATE_GRID", payload: { instrument: "constructor", step: 0, value: 1 } })
      expect(Object.keys(proc.grid)).toEqual(["kick"])

      send(proc, { type: "UPDATE_GRID", payload: { instrument: "snare", step: 3, value: 1 } })
      expect(proc.grid.snare[3]).toBe(1)
    })

    it("trims grid rows to gridLength", () => {
      send(proc, {
        type: "INIT_GRID",
        payload: { grid: { kick: ones(40) }, gridLength: 16, stepsPerBeat: 4 },
      })
      expect(proc.grid.kick).toHaveLength(16)
    })

    it("clamps bpm and rejects an absurd steps-per-beat so steps stay longer than a quantum", () => {
      send(proc, { type: "SET_BPM", payload: 1e9 })
      expect(proc.bpm).toBeLessThanOrEqual(400)

      send(proc, { type: "UPDATE_SPB", payload: 1e9 })
      expect(proc.stepsPerBeat).toBe(1)

      sequencer(proc, { kick: ones(16) }, 1e9, 1e9)
      send(proc, { type: "START" })
      runQuantum(proc)
      expect(ofType(proc, "TICK").length).toBeLessThanOrEqual(1)
    })
  })

  describe("sequencer", () => {
    it("ticks through the steps at the bpm and wraps around", () => {
      // 120 bpm, 4 steps per beat -> 6000 samples per step.
      sequencer(proc, { kick: [1, 0, 0, 0] })
      send(proc, {
        type: "INIT_GRID",
        payload: { grid: { kick: [1, 0, 0, 0] }, gridLength: 4, stepsPerBeat: 4 },
      })
      send(proc, { type: "SET_BPM", payload: 120 })
      send(proc, { type: "START" })

      const quantaForFiveSteps = Math.ceil((6000 * 4) / QUANTUM) + 1
      for (let i = 0; i < quantaForFiveSteps; i++) runQuantum(proc)

      const steps = ofType(proc, "TICK").map((m) => m.step)
      expect(steps).toEqual([0, 1, 2, 3, 0])
    })

    it("renders sound on an active step and stays silent otherwise", () => {
      sequencer(proc, { kick: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] })
      send(proc, { type: "START" })
      expect(runQuantum(proc).output.some((s) => s !== 0)).toBe(true)

      // Move past the 40ms click, still before step 1 (6000 samples).
      for (let i = 0; i < 20; i++) runQuantum(proc)
      expect(runQuantum(proc).output.every((s) => s === 0)).toBe(true)
    })

    it("does not tick before START or without a grid", () => {
      runQuantum(proc)
      sequencer(proc, { kick: [1] })
      runQuantum(proc)
      expect(ofType(proc, "TICK")).toHaveLength(0)

      const fresh = new Ctor()
      send(fresh, { type: "START" })
      runQuantum(fresh)
      expect(ofType(fresh, "TICK")).toHaveLength(0)
    })

    it("STOP rewinds to the first step and drops sounding voices", () => {
      sequencer(proc, { kick: ones(16) })
      send(proc, { type: "START" })
      for (let i = 0; i < 60; i++) runQuantum(proc)
      expect(proc.currentStep).toBeGreaterThan(0)

      send(proc, { type: "STOP" })
      expect(proc.isPlaying).toBe(false)
      expect(proc.currentStep).toBe(0)
      expect(proc.activeVoices).toHaveLength(0)
    })
  })

  describe("taking over the node", () => {
    it("INIT_GRID wipes what the previous tool left behind", () => {
      sequencer(proc, { kick: ones(16) }, 120, 4)
      send(proc, { type: "START" })
      for (let i = 0; i < 60; i++) runQuantum(proc)

      send(proc, {
        type: "INIT_GRID",
        payload: { grid: { beep: [1, 0] }, gridLength: 2, stepsPerBeat: 1 },
      })

      expect(proc.isPlaying).toBe(false)
      expect(proc.currentStep).toBe(0)
      expect(proc.activeVoices).toHaveLength(0)
      expect(proc.totalSteps).toBe(2)
      expect(proc.stepsPerBeat).toBe(1)
      expect(Object.keys(proc.grid)).toEqual(["beep"])
    })

    it("SET_MODE resets all sequencer and pitch state", () => {
      sequencer(proc, { kick: ones(16) })
      send(proc, { type: "START" })
      for (let i = 0; i < 60; i++) runQuantum(proc)

      send(proc, { type: "SET_MODE", payload: "pitch" })

      expect(proc.mode).toBe("pitch")
      expect(proc.isPlaying).toBe(false)
      expect(proc.grid).toEqual({})
      expect(proc.totalSteps).toBe(0)
      expect(proc.stepsPerBeat).toBe(1)
      expect(proc.currentStep).toBe(0)
      expect(proc.activeVoices).toHaveLength(0)
      expect(proc.pitchBufferFill).toBe(0)
    })
  })

  describe("pitch mode", () => {
    it("posts a 100ms chunk, transfers the buffer and keeps the output silent", () => {
      send(proc, { type: "SET_MODE", payload: "pitch" })
      send(proc, { type: "START" })

      const input = new Float32Array(QUANTUM).fill(0.5)
      const chunkSize = Math.round(SAMPLE_RATE * 0.1)
      const quanta = Math.ceil(chunkSize / QUANTUM)
      for (let i = 0; i < quanta; i++) {
        expect(runQuantum(proc, input).output.every((s) => s === 0)).toBe(true)
      }

      const chunks = ofType(proc, "PITCH_CHUNK")
      expect(chunks).toHaveLength(1)
      expect((chunks[0].payload as Float32Array).length).toBe(chunkSize)
      const transfer = proc.port.postMessage.mock.calls.find(
        (c) => c[0].type === "PITCH_CHUNK",
      )?.[1]
      expect(transfer).toHaveLength(1)
    })

    it("survives a quantum with no input connected", () => {
      send(proc, { type: "SET_MODE", payload: "pitch" })
      send(proc, { type: "START" })
      expect(() => runQuantum(proc)).not.toThrow()
    })
  })

  describe("process()", () => {
    it("always returns true", () => {
      expect(runQuantum(proc).result).toBe(true)
      sequencer(proc, { kick: [1] })
      send(proc, { type: "START" })
      expect(runQuantum(proc).result).toBe(true)
      send(proc, { type: "SET_MODE", payload: "pitch" })
      send(proc, { type: "START" })
      expect(runQuantum(proc).result).toBe(true)
    })
  })

  describe("idle auto-suspend", () => {
    it("posts AUTO_SUSPEND once per idle period", () => {
      send(proc, { type: "STOP" })

      setTime(4)
      runQuantum(proc)
      expect(ofType(proc, "AUTO_SUSPEND")).toHaveLength(0)

      setTime(6)
      runQuantum(proc)
      runQuantum(proc)
      expect(ofType(proc, "AUTO_SUSPEND")).toHaveLength(1)
    })

    it("never fires while playing and re-arms after the next STOP", () => {
      send(proc, { type: "STOP" })
      setTime(6)
      runQuantum(proc)
      expect(ofType(proc, "AUTO_SUSPEND")).toHaveLength(1)

      send(proc, { type: "START" })
      setTime(100)
      runQuantum(proc)
      expect(ofType(proc, "AUTO_SUSPEND")).toHaveLength(1)

      send(proc, { type: "STOP" })
      setTime(104)
      runQuantum(proc)
      expect(ofType(proc, "AUTO_SUSPEND")).toHaveLength(1)
      setTime(106)
      runQuantum(proc)
      expect(ofType(proc, "AUTO_SUSPEND")).toHaveLength(2)
    })
  })
})
