import { expect, test } from "@playwright/test"

// The unit tests run the processor against a stubbed AudioWorkletGlobalScope. This is the one
// check that the served file loads in a real browser and speaks the documented protocol.
test("public/worklets/processor.js loads in Chromium and follows the message contract", async ({
  page,
}) => {
  await page.goto("/")
  await page.locator("body").click() // user activation, so the AudioContext may resume

  const result = await page.evaluate(async () => {
    const ctx = new AudioContext()
    await ctx.resume()
    await ctx.audioWorklet.addModule("/worklets/processor.js")

    const node = new AudioWorkletNode(ctx, "audio-processor")
    const analyser = ctx.createAnalyser()
    node.connect(analyser)

    const types: string[] = []
    const ticks: number[] = []
    const done = new Promise<void>((resolve) => {
      node.port.addEventListener("message", (e: MessageEvent<{ type: string; step?: number }>) => {
        types.push(e.data.type)
        if (e.data.type === "TICK" && e.data.step !== undefined) {
          ticks.push(e.data.step)
          if (ticks.length === 4) resolve()
        }
      })
    })
    node.port.start()

    node.port.postMessage({
      type: "INIT_GRID",
      payload: { grid: { kick: [1, 0, 0, 0] }, gridLength: 4, stepsPerBeat: 1 },
    })
    node.port.postMessage({ type: "SET_BPM", payload: 400 }) // one step every 150ms
    node.port.postMessage({ type: "START" })

    let peak = 0
    const samples = new Float32Array(analyser.fftSize)
    const timer = setInterval(() => {
      analyser.getFloatTimeDomainData(samples)
      for (const s of samples) peak = Math.max(peak, Math.abs(s))
    }, 5)

    await Promise.race([done, new Promise((resolve) => setTimeout(resolve, 5000))])
    clearInterval(timer)
    node.port.postMessage({ type: "STOP" })
    await ctx.close()
    return { types, ticks, peak }
  })

  expect(result.types).toContain("READY")
  expect(result.ticks).toEqual([0, 1, 2, 3])
  expect(result.peak).toBeGreaterThan(0) // the kick actually rendered audio
})

// The WASM detector is driven by hand inside the worklet (no TextDecoder/fetch there), so only a
// real AudioWorkletGlobalScope proves it instantiates. A 110 Hz oscillator feeds the node.
test("pitch mode runs the WASM detector in Chromium and finds the oscillator's frequency", async ({
  page,
}) => {
  await page.goto("/")
  await page.locator("body").click()

  const result = await page.evaluate(async () => {
    const ctx = new AudioContext()
    await ctx.resume()
    await ctx.audioWorklet.addModule("/worklets/processor.js")
    const node = new AudioWorkletNode(ctx, "audio-processor")

    const types: string[] = []
    const freqs: number[] = []
    node.port.addEventListener(
      "message",
      (e: MessageEvent<{ type: string; payload?: { freq: number } }>) => {
        types.push(e.data.type)
        if (e.data.type === "PITCH" && e.data.payload && e.data.payload.freq > 0) {
          freqs.push(e.data.payload.freq)
        }
      },
    )
    node.port.start()

    const bytes = await (await fetch("/worklets/pitch-detector.wasm")).arrayBuffer()
    node.port.postMessage({ type: "LOAD_WASM", payload: bytes }, [bytes])
    node.port.postMessage({
      type: "SET_PITCH_CONFIG",
      payload: { windowSize: 8192, minFreq: 60, maxFreq: 400, gate: 0.01, clarity: 0.8 },
    })

    const osc = ctx.createOscillator()
    osc.frequency.value = 110
    const gain = ctx.createGain()
    gain.gain.value = 0.5
    osc.connect(gain).connect(node)
    osc.start()
    node.port.postMessage({ type: "START" })

    const deadline = Date.now() + 5000
    while (freqs.length < 15 && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
    node.port.postMessage({ type: "STOP" })
    await ctx.close()
    return { types, freqs }
  })

  expect(result.types).toContain("WASM_READY")
  expect(result.types).not.toContain("WASM_ERROR")
  expect(result.freqs.length).toBeGreaterThanOrEqual(15)
  // The first windows still hold the silence before the oscillator started: judge the settled ones.
  for (const f of result.freqs.slice(-5)) expect(f).toBeCloseTo(110, 0)
})
