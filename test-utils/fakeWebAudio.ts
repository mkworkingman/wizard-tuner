import { vi } from "vitest"

type Listener = (event: unknown) => void

/** Minimal EventTarget: records listeners so tests can fire events and count them. */
export class FakeEmitter {
  listeners = new Map<string, Set<Listener>>()

  addEventListener(type: string, listener: Listener) {
    const set = this.listeners.get(type) ?? new Set<Listener>()
    set.add(listener)
    this.listeners.set(type, set)
  }

  removeEventListener(type: string, listener: Listener) {
    this.listeners.get(type)?.delete(listener)
  }

  listenerCount(type: string) {
    return this.listeners.get(type)?.size ?? 0
  }

  emit(type: string, event: unknown) {
    for (const listener of this.listeners.get(type) ?? []) listener(event)
  }
}

export class FakePort extends FakeEmitter {
  onmessage: unknown = null
  start = vi.fn()
  postMessage = vi.fn()

  /** Simulates the processor posting a message to the main thread. */
  receive(data: unknown) {
    this.emit("message", { data })
  }
}

export class FakeWorkletNode extends FakeEmitter {
  port = new FakePort()
  connect = vi.fn()
  disconnect = vi.fn()
  constructor(
    public ctx: FakeAudioContext,
    public name: string,
  ) {
    super()
    fakeAudio.nodes.push(this)
  }
}

export class FakeAudioContext {
  // A context created outside a user gesture starts suspended.
  state: "suspended" | "running" | "closed" = "suspended"
  destination = {}
  addModule = vi.fn((): Promise<void> => {
    if (fakeAudio.failNextAddModule) {
      fakeAudio.failNextAddModule = false
      return Promise.reject(new Error("addModule failed"))
    }
    return Promise.resolve()
  })
  audioWorklet = { addModule: this.addModule }
  suspend = vi.fn(() => {
    this.state = "suspended"
    return Promise.resolve()
  })
  resume = vi.fn(() => {
    this.state = "running"
    return Promise.resolve()
  })
  close = vi.fn(() => Promise.resolve())

  constructor() {
    fakeAudio.contexts.push(this)
  }
}

export const fakeAudio = {
  contexts: [] as FakeAudioContext[],
  nodes: [] as FakeWorkletNode[],
  failNextAddModule: false,
}

/** Installs fake AudioContext / AudioWorkletNode globals. Call in beforeEach. */
export function installFakeWebAudio() {
  fakeAudio.contexts = []
  fakeAudio.nodes = []
  fakeAudio.failNextAddModule = false
  vi.stubGlobal("AudioContext", FakeAudioContext)
  vi.stubGlobal("AudioWorkletNode", FakeWorkletNode)
}
