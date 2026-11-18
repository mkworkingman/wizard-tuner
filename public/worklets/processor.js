// One processor for every tool. A tool picks its DSP with a mode:
//   'sequencer' - beat machine / metronome: renders clicks from a step grid
//   'pitch'     - tuner: runs the WASM McLeod detector on the mic input, off the main thread
//
// Messages in:
//   { type: 'SET_MODE', payload: 'sequencer' | 'pitch' }   resets all state
//   { type: 'INIT_GRID', payload: { grid, gridLength, stepsPerBeat } }  (enters 'sequencer')
//   { type: 'UPDATE_GRID', payload: { instrument, step, value } }
//   { type: 'UPDATE_SPB', payload: number }
//   { type: 'SET_BPM', payload: number }
//   { type: 'LOAD_WASM', payload: ArrayBuffer }   pitch detector bytes (/worklets/pitch-detector.wasm)
//   { type: 'SET_PITCH_CONFIG', payload: { windowSize, hopMs, gate, clarity, minFreq, maxFreq } }
//                                                 (enters 'pitch'; every field optional, invalid ones ignored)
//   { type: 'START' } / { type: 'STOP' }          both modes
//
// Messages out:
//   { type: 'READY' }                        once per tab
//   { type: 'TICK', step }                   sequencer
//   { type: 'WASM_READY' } / { type: 'WASM_ERROR' }  after LOAD_WASM (WASM_READY repeats if already loaded)
//   { type: 'PITCH', payload: { freq, clarity, rms } }  pitch; freq is 0 when gated or nothing confident
//   { type: 'AUTO_SUSPEND' }                 once per idle period
//
// Pitch config: windowSize is a power of two 256..8192 (samples analysed per detection), hopMs
// how often to detect, gate the RMS level below which input counts as silence, clarity the McLeod
// confidence needed (0..1), minFreq/maxFreq the accepted range in Hz.

const IDLE_SUSPEND_SECONDS = 5
const CLICK_DURATION = Math.round(0.04 * sampleRate) // 40ms

// Pitch mode. The ring holds the newest samples; a detection reads the last windowSize of them.
const PITCH_RING_SIZE = 8192
const PITCH_WINDOW_SIZES = [256, 512, 1024, 2048, 4096, 8192]
const DEFAULT_PITCH_CONFIG = {
  windowSize: 4096,
  hopMs: 50,
  gate: 0.01,
  clarity: 0.8,
  minFreq: 30,
  maxFreq: 1500,
}

const INSTRUMENT_CONFIG = {
  kick: { freq: 60, gain: 0.2 },
  snare: { freq: 220, gain: 0.1 },
  hats: { freq: 1760, gain: 0.1 },
  crash: { freq: 3520, gain: 0.1 },
  beep: { freq: 440, gain: 0.1 },
  accent: { freq: 880, gain: 0.1 },
}

// Upper bounds: a huge bpm or steps-per-beat makes a step shorter than one
// sample, and then TICK is posted for every sample and floods the port.
const MAX_BPM = 400
const MAX_STEPS_PER_BEAT = 32

const isPositiveNumber = (n) => typeof n === "number" && Number.isFinite(n) && n > 0
const isStepsPerBeat = (n) => Number.isInteger(n) && n > 0 && n <= MAX_STEPS_PER_BEAT
const isInstrument = (name) => Object.hasOwn(INSTRUMENT_CONFIG, name)
const isStepIndex = (n, length) => Number.isInteger(n) && n >= 0 && n < length
const isNumberBetween = (n, min, max) =>
  typeof n === "number" && Number.isFinite(n) && n >= min && n <= max

// The compiled detector was built with wasm-bindgen but is driven by hand: the worklet scope has
// no TextDecoder/fetch/import.meta, which the generated JS glue needs. Imports are matched by
// name fragment because wasm-bindgen puts a hash in the throw import's name.
async function instantiatePitchWasm(bytes) {
  const compiled = await WebAssembly.compile(bytes)
  let wasm = null
  const imports = {}
  for (const { module: ns, name, kind } of WebAssembly.Module.imports(compiled)) {
    if (kind !== "function") throw new Error("unexpected wasm import " + name)
    imports[ns] ??= {}
    if (name.includes("throw")) {
      imports[ns][name] = () => {
        throw new Error("pitch wasm panicked")
      }
    } else if (name.includes("init_externref_table")) {
      imports[ns][name] = () => {
        const table = wasm.__wbindgen_externrefs
        const offset = table.grow(4)
        table.set(0, undefined)
        table.set(offset, undefined)
        table.set(offset + 1, null)
        table.set(offset + 2, true)
        table.set(offset + 3, false)
      }
    } else {
      throw new Error("unexpected wasm import " + name)
    }
  }
  const instance = await WebAssembly.instantiate(compiled, imports)
  wasm = instance.exports
  wasm.__wbindgen_start()
  return wasm
}

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.pitchRing = new Float32Array(PITCH_RING_SIZE)
    this.bpm = 120

    // The detector outlives mode switches: it is loaded once per tab.
    this.wasm = null
    this.tuner = 0
    this.wasmLoading = false

    this.enterMode("sequencer")

    this.port.onmessage = (e) => this.handleMessage(e.data)
    this.port.postMessage({ type: "READY" })
  }

  // Wipes everything the previous tool left behind. bpm survives: every
  // tool re-sends it with its config anyway.
  enterMode(mode) {
    this.mode = mode
    this.isPlaying = false
    this.lastActiveTime = null
    this.idleReported = false

    // sequencer
    this.grid = {}
    this.totalSteps = 0
    this.stepsPerBeat = 1
    this.currentStep = 0
    this.sampleCount = 0
    this.activeVoices = []

    // pitch
    this.pitchConfig = { ...DEFAULT_PITCH_CONFIG }
    this.pitchRingPos = 0
    this.pitchRingFill = 0
    this.pitchSinceDetect = 0
  }

  handleMessage(data) {
    if (!data || typeof data !== "object") return
    const { type, payload } = data

    switch (type) {
      case "SET_MODE":
        if (payload === "sequencer" || payload === "pitch") this.enterMode(payload)
        break

      case "START":
        this.isPlaying = true
        this.idleReported = false
        break

      case "STOP":
        this.isPlaying = false
        this.currentStep = 0
        this.sampleCount = 0
        this.activeVoices = []
        this.pitchRingFill = 0
        this.pitchSinceDetect = 0
        this.lastActiveTime = currentTime
        this.idleReported = false
        break

      case "SET_BPM":
        if (isPositiveNumber(payload)) this.bpm = Math.min(payload, MAX_BPM)
        break

      case "INIT_GRID": {
        if (!payload || typeof payload.grid !== "object" || payload.grid === null) break
        const { grid, gridLength, stepsPerBeat } = payload
        if (!Number.isInteger(gridLength) || gridLength <= 0) break
        if (!isStepsPerBeat(stepsPerBeat)) break

        const cleanGrid = {}
        for (const instrument in grid) {
          if (isInstrument(instrument) && Array.isArray(grid[instrument])) {
            cleanGrid[instrument] = grid[instrument].slice(0, gridLength)
          }
        }

        this.enterMode("sequencer")
        this.grid = cleanGrid
        this.totalSteps = gridLength
        this.stepsPerBeat = stepsPerBeat
        break
      }

      case "UPDATE_GRID": {
        if (!payload) break
        const { instrument, step, value } = payload
        if (!isInstrument(instrument) || !isStepIndex(step, this.totalSteps)) break
        ;(this.grid[instrument] ??= [])[step] = value
        break
      }

      case "UPDATE_SPB":
        if (isStepsPerBeat(payload)) this.stepsPerBeat = payload
        break

      case "LOAD_WASM":
        this.loadWasm(payload)
        break

      case "SET_PITCH_CONFIG":
        this.setPitchConfig(payload)
        break
    }
  }

  process(inputs, outputs) {
    if (!this.isPlaying) {
      this.checkIdle()
      return true
    }

    if (this.mode === "pitch") {
      // Outputs stay zero-filled: the node is wired to the speakers, and
      // echoing the mic back would feed back.
      this.processPitch(inputs[0]?.[0])
    } else {
      this.processSequencer(outputs[0]?.[0])
    }

    return true
  }

  checkIdle() {
    if (this.idleReported || this.lastActiveTime === null) return
    if (currentTime - this.lastActiveTime >= IDLE_SUSPEND_SECONDS) {
      this.idleReported = true
      this.port.postMessage({ type: "AUTO_SUSPEND" })
    }
  }

  loadWasm(bytes) {
    if (this.wasm) {
      this.port.postMessage({ type: "WASM_READY" })
      return
    }
    // toString rather than instanceof: robust to ArrayBuffers from another realm.
    const isBuffer = Object.prototype.toString.call(bytes) === "[object ArrayBuffer]"
    if (this.wasmLoading || !isBuffer || bytes.byteLength === 0) return

    this.wasmLoading = true
    instantiatePitchWasm(bytes)
      .then((wasm) => {
        this.tuner = wasm.tuner_new(this.pitchConfig.windowSize)
        this.wasm = wasm
        this.port.postMessage({ type: "WASM_READY" })
      })
      .catch(() => {
        this.port.postMessage({ type: "WASM_ERROR" })
      })
      .finally(() => {
        this.wasmLoading = false
      })
  }

  setPitchConfig(payload) {
    if (!payload || typeof payload !== "object") return
    if (this.mode !== "pitch") this.enterMode("pitch")

    const config = this.pitchConfig
    if (PITCH_WINDOW_SIZES.includes(payload.windowSize)) config.windowSize = payload.windowSize
    if (isNumberBetween(payload.hopMs, 10, 500)) config.hopMs = payload.hopMs
    if (isNumberBetween(payload.gate, 0, 1)) config.gate = payload.gate
    if (isNumberBetween(payload.clarity, 0, 1)) config.clarity = payload.clarity

    const minFreq = isNumberBetween(payload.minFreq, 1, 20000) ? payload.minFreq : config.minFreq
    const maxFreq = isNumberBetween(payload.maxFreq, 1, 20000) ? payload.maxFreq : config.maxFreq
    if (minFreq < maxFreq) {
      config.minFreq = minFreq
      config.maxFreq = maxFreq
    }
  }

  processPitch(input) {
    if (!input) return

    const ring = this.pitchRing
    const first = Math.min(input.length, PITCH_RING_SIZE - this.pitchRingPos)
    ring.set(input.subarray(0, first), this.pitchRingPos)
    if (first < input.length) ring.set(input.subarray(first), 0)
    this.pitchRingPos = (this.pitchRingPos + input.length) % PITCH_RING_SIZE
    this.pitchRingFill = Math.min(PITCH_RING_SIZE, this.pitchRingFill + input.length)
    this.pitchSinceDetect += input.length

    const { windowSize, hopMs } = this.pitchConfig
    if (this.pitchRingFill >= windowSize && this.pitchSinceDetect >= (hopMs / 1000) * sampleRate) {
      this.pitchSinceDetect = 0
      this.detectPitch()
    }
  }

  // Runs the detector on the newest windowSize samples and posts one PITCH message.
  detectPitch() {
    const { windowSize, gate, clarity, minFreq, maxFreq } = this.pitchConfig
    const ring = this.pitchRing
    const start = (this.pitchRingPos - windowSize + PITCH_RING_SIZE) % PITCH_RING_SIZE

    let sumSquares = 0
    for (let i = 0; i < windowSize; i++) {
      const v = ring[(start + i) % PITCH_RING_SIZE]
      sumSquares += v * v
    }
    const rms = Math.sqrt(sumSquares / windowSize)

    let freq = 0
    let found = 0
    if (this.wasm && rms >= gate) {
      try {
        // Same call sequence as the wasm-bindgen glue: the callee frees the input, we free the result.
        const wasm = this.wasm
        const ptr = wasm.__wbindgen_malloc(windowSize * 4, 4) >>> 0
        const input = new Float32Array(wasm.memory.buffer, ptr, windowSize)
        const tail = PITCH_RING_SIZE - start
        if (tail >= windowSize) {
          input.set(ring.subarray(start, start + windowSize))
        } else {
          input.set(ring.subarray(start))
          input.set(ring.subarray(0, windowSize - tail), tail)
        }

        const [outPtr, outLen] = wasm.tuner_detect(
          this.tuner,
          ptr,
          windowSize,
          sampleRate,
          gate * gate * windowSize,
          clarity,
        )
        const out = new Float64Array(wasm.memory.buffer, outPtr, outLen)
        freq = out[0]
        found = out[1]
        wasm.__wbindgen_free(outPtr, outLen * 8, 8)
      } catch {
        // A trap leaves the wasm instance in an unknown state: stop using it.
        this.wasm = null
        this.port.postMessage({ type: "WASM_ERROR" })
      }
    }

    if (!(freq >= minFreq && freq <= maxFreq)) {
      freq = 0
      found = 0
    }
    this.port.postMessage({ type: "PITCH", payload: { freq, clarity: found, rms } })
  }

  processSequencer(channel) {
    if (!channel || !this.totalSteps) return

    const samplesPerStep = (sampleRate * 60) / this.bpm / this.stepsPerBeat

    for (let i = 0; i < channel.length; i++) {
      if (this.sampleCount <= 0) {
        this.triggerStep(this.currentStep)
        this.port.postMessage({ type: "TICK", step: this.currentStep })

        this.sampleCount += samplesPerStep
        this.currentStep = (this.currentStep + 1) % this.totalSteps
      }

      let mixedSample = 0

      for (let j = this.activeVoices.length - 1; j >= 0; j--) {
        const voice = this.activeVoices[j]
        const t = voice.elapsed / sampleRate
        const signal = Math.sign(Math.sin(2 * Math.PI * voice.freq * t))
        const envelope = 1 - voice.elapsed / CLICK_DURATION

        mixedSample += signal * envelope * voice.gain
        voice.elapsed++

        if (voice.elapsed >= CLICK_DURATION) {
          this.activeVoices.splice(j, 1)
        }
      }

      channel[i] = Math.tanh(mixedSample)
      this.sampleCount--
    }
  }

  triggerStep(step) {
    for (const instrument in this.grid) {
      if (this.grid[instrument][step] === 1) {
        const { freq, gain } = INSTRUMENT_CONFIG[instrument]
        this.activeVoices.push({ freq, gain, elapsed: 0 })
      }
    }
  }
}

registerProcessor("audio-processor", AudioProcessor)
