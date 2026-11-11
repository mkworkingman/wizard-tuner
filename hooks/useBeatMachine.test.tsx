import { act, render, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { FakePort } from "@/test-utils/fakeWebAudio"

const mocks = vi.hoisted(() => ({
  log: [] as string[],
  status: "success",
  node: null as { port: unknown } | null,
  runAudio: () => Promise.resolve(),
  actions: {
    initAudio: vi.fn(() => Promise.resolve()),
    runAudio: vi.fn(() => mocks.runAudio()),
    stopAudio: vi.fn(() => {
      mocks.log.push("stopAudio")
    }),
    suspendAudio: vi.fn(() => {
      mocks.log.push("suspendAudio")
    }),
  },
}))

vi.mock("@/store/audio-engine", () => ({
  useAudioActions: () => mocks.actions,
  useAudioStatus: () => mocks.status,
  useWorkletNode: () => mocks.node,
}))

import { useBeatMachine } from "./useBeatMachine"

let port: FakePort

const messages = () => port.postMessage.mock.calls.map((c) => c[0] as { type: string })
const types = () => messages().map((m) => m.type)

beforeEach(() => {
  vi.clearAllMocks()
  mocks.log = []
  mocks.status = "success"
  mocks.runAudio = () => Promise.resolve()
  port = new FakePort()
  mocks.node = { port }
  port.postMessage.mockImplementation((m: { type: string }) => {
    mocks.log.push(m.type)
  })
})

describe("useBeatMachine", () => {
  it("sends the full config on every mount, without waiting for READY", () => {
    const first = renderHook(() => useBeatMachine())
    first.unmount()
    port.postMessage.mockClear()
    renderHook(() => useBeatMachine())

    const [init, bpm] = messages() as { type: string; payload: Record<string, unknown> }[]
    expect(init.type).toBe("INIT_GRID")
    expect(init.payload).toMatchObject({ gridLength: 16, stepsPerBeat: 4 })
    expect(bpm).toEqual({ type: "SET_BPM", payload: 120 })
  })

  it("calls initAudio but posts nothing while there is no node yet", () => {
    mocks.node = null
    renderHook(() => useBeatMachine())

    expect(mocks.actions.initAudio).toHaveBeenCalled()
    expect(port.postMessage).not.toHaveBeenCalled()
  })

  it("listens with addEventListener, starts the port and never uses onmessage", () => {
    const { unmount } = renderHook(() => useBeatMachine())

    expect(port.listenerCount("message")).toBe(1)
    expect(port.start).toHaveBeenCalled()
    expect(port.onmessage).toBeNull()

    unmount()
    expect(port.listenerCount("message")).toBe(0)
    expect(port.onmessage).toBeNull()
  })

  it("on unmount posts STOP, then stops and suspends the engine", () => {
    const { unmount } = renderHook(() => useBeatMachine())
    mocks.log = []

    unmount()

    expect(mocks.log).toEqual(["STOP", "stopAudio", "suspendAudio"])
  })

  it("marks the ticking step with data-active and clears it on unmount", () => {
    function Harness() {
      const { stepIndicatorRef } = useBeatMachine()
      return (
        <div ref={stepIndicatorRef}>
          <span data-step="0" />
          <span data-step="1" />
          <span data-step="2" />
        </div>
      )
    }
    const { container, unmount } = render(<Harness />)
    const active = () =>
      [...container.querySelectorAll("[data-active]")].map((el) => el.getAttribute("data-step"))

    act(() => {
      port.receive({ type: "TICK", step: 1 })
    })
    expect(active()).toEqual(["1"])

    act(() => {
      port.receive({ type: "TICK", step: 2 })
    })
    expect(active()).toEqual(["2"])

    act(() => {
      port.receive({ type: "TICK", step: "x" })
    })
    act(() => {
      port.receive({ type: "OTHER", step: 0 })
    })
    expect(active()).toEqual(["2"])

    unmount()
    expect(container.querySelectorAll("[data-active]")).toHaveLength(0)
  })

  it("startAudio resumes first, then posts START", async () => {
    const { result } = renderHook(() => useBeatMachine())
    mocks.log = []
    mocks.runAudio = () => {
      mocks.log.push("runAudio")
      return Promise.resolve()
    }

    await act(() => result.current.startAudio())

    expect(mocks.log).toEqual(["runAudio", "START"])
    expect(result.current.isPlaying).toBe(true)
  })

  it("stopAudio stops the engine, posts STOP and clears isPlaying", async () => {
    const { result } = renderHook(() => useBeatMachine())
    await act(() => result.current.startAudio())
    mocks.log = []

    act(() => {
      result.current.stopAudio()
    })

    expect(mocks.log).toEqual(["stopAudio", "STOP"])
    expect(result.current.isPlaying).toBe(false)
  })

  it("does not start the beat if the page was left while the context was resuming", async () => {
    let finishResume: () => void = vi.fn()
    mocks.runAudio = () =>
      new Promise<void>((resolve) => {
        finishResume = resolve
      })
    const { result, unmount } = renderHook(() => useBeatMachine())

    let pending: Promise<void> = Promise.resolve()
    act(() => {
      pending = result.current.startAudio()
    })
    unmount()
    mocks.log = []
    mocks.actions.stopAudio.mockClear()

    await act(async () => {
      finishResume()
      await pending
    })

    expect(types()).not.toContain("START")
    expect(mocks.actions.stopAudio).toHaveBeenCalledTimes(1)
  })

  it("reports not ready and not playing once the engine has failed", async () => {
    const { result, rerender } = renderHook(() => useBeatMachine())
    await act(() => result.current.startAudio())
    expect(result.current.isReady).toBe(true)
    expect(result.current.isPlaying).toBe(true)

    mocks.status = "failure"
    rerender()

    expect(result.current.isReady).toBe(false)
    expect(result.current.isPlaying).toBe(false)
  })
})
