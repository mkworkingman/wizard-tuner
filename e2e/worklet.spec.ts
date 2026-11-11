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
