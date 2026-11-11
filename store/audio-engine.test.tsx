import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { fakeAudio, installFakeWebAudio } from "@/test-utils/fakeWebAudio"

// The store keeps module-level state (initPromise, moduleLoaded): load a fresh copy per test.
async function loadEngine() {
  vi.resetModules()
  const engine = await import("./audio-engine")
  return renderHook(() => ({
    actions: engine.useAudioActions(),
    status: engine.useAudioStatus(),
    node: engine.useWorkletNode(),
  }))
}

const ctx = () => fakeAudio.contexts[0]
const node = () => fakeAudio.nodes[0]

describe("audio engine store", () => {
  beforeEach(() => {
    installFakeWebAudio()
    vi.spyOn(console, "error").mockImplementation(() => undefined)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("shares one in-flight init between concurrent callers", async () => {
    const { result } = await loadEngine()

    await act(async () => {
      await Promise.all([result.current.actions.initAudio(), result.current.actions.initAudio()])
    })

    expect(fakeAudio.contexts).toHaveLength(1)
    expect(fakeAudio.nodes).toHaveLength(1)
    expect(ctx().addModule).toHaveBeenCalledTimes(1)
    expect(result.current.status).toBe("success")
    expect(result.current.node).toBe(node())
    expect(node().connect).toHaveBeenCalledWith(ctx().destination)
  })

  it("does not build a second context or node on later inits", async () => {
    const { result } = await loadEngine()

    await act(() => result.current.actions.initAudio())
    await act(() => result.current.actions.initAudio())

    expect(fakeAudio.contexts).toHaveLength(1)
    expect(fakeAudio.nodes).toHaveLength(1)
    expect(ctx().addModule).toHaveBeenCalledTimes(1)
  })

  it("keeps the context when addModule fails and reuses it on retry", async () => {
    const { result } = await loadEngine()
    fakeAudio.failNextAddModule = true

    await act(() => result.current.actions.initAudio())
    expect(result.current.status).toBe("failure")
    expect(fakeAudio.contexts).toHaveLength(1)
    expect(fakeAudio.nodes).toHaveLength(0)

    await act(() => result.current.actions.initAudio())
    expect(result.current.status).toBe("success")
    expect(fakeAudio.contexts).toHaveLength(1)
    expect(fakeAudio.nodes).toHaveLength(1)
  })

  it("does nothing on runAudio before init finished", async () => {
    const { result } = await loadEngine()

    await act(() => result.current.actions.runAudio())

    expect(fakeAudio.contexts).toHaveLength(0)
  })

  it("resumes a suspended context on runAudio", async () => {
    const { result } = await loadEngine()
    await act(() => result.current.actions.initAudio())

    await act(() => result.current.actions.runAudio())

    expect(ctx().resume).toHaveBeenCalledTimes(1)
  })

  it("refuses to suspend while running, and suspends after stopAudio", async () => {
    const { result } = await loadEngine()
    await act(() => result.current.actions.initAudio())
    await act(() => result.current.actions.runAudio())
    ctx().suspend.mockClear()

    act(() => {
      result.current.actions.suspendAudio()
    })
    expect(ctx().suspend).not.toHaveBeenCalled()

    act(() => {
      result.current.actions.stopAudio()
      result.current.actions.suspendAudio()
    })
    expect(ctx().suspend).toHaveBeenCalledTimes(1)
  })

  it("suspends on AUTO_SUSPEND from the processor, but only when not running", async () => {
    const { result } = await loadEngine()
    await act(() => result.current.actions.initAudio())
    ctx().suspend.mockClear()

    node().port.receive({ type: "AUTO_SUSPEND" })
    expect(ctx().suspend).toHaveBeenCalledTimes(1)

    await act(() => result.current.actions.runAudio())
    ctx().suspend.mockClear()
    node().port.receive({ type: "AUTO_SUSPEND" })
    expect(ctx().suspend).not.toHaveBeenCalled()
  })

  it("listens for AUTO_SUSPEND and processorerror once, and starts the port", async () => {
    const { result } = await loadEngine()
    await act(() => result.current.actions.initAudio())
    await act(() => result.current.actions.initAudio())

    expect(node().port.listenerCount("message")).toBe(1)
    expect(node().listenerCount("processorerror")).toBe(1)
    expect(node().port.start).toHaveBeenCalledTimes(1)
  })

  it("never closes the context, disconnects the node or resets status over a full cycle", async () => {
    const { result } = await loadEngine()
    await act(() => result.current.actions.initAudio())
    await act(() => result.current.actions.runAudio())
    act(() => {
      result.current.actions.stopAudio()
      result.current.actions.suspendAudio()
    })

    expect(ctx().close).not.toHaveBeenCalled()
    expect(node().disconnect).not.toHaveBeenCalled()
    expect(result.current.status).toBe("success")
    expect(result.current.node).toBe(node())
  })

  it("reports failure on processorerror and does not claim success with the dead node on retry", async () => {
    const { result } = await loadEngine()
    await act(() => result.current.actions.initAudio())
    await act(() => result.current.actions.runAudio())

    act(() => {
      node().emit("processorerror", new Event("processorerror"))
    })
    expect(result.current.status).toBe("failure")

    await act(() => result.current.actions.initAudio())
    expect(result.current.status).toBe("failure")
    expect(fakeAudio.nodes).toHaveLength(1)

    // The crash cleared isRunning, so suspend is allowed again.
    ctx().suspend.mockClear()
    act(() => {
      result.current.actions.suspendAudio()
    })
    expect(ctx().suspend).toHaveBeenCalledTimes(1)
  })
})
