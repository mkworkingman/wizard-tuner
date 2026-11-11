import { create } from "zustand"

type AudioEngineState = {
  ctx: AudioContext | null
  workletNode: AudioWorkletNode | null
  isRunning: boolean
  status: "idle" | "pending" | "success" | "failure"
  actions: {
    initAudio: () => Promise<void>
    runAudio: () => Promise<void>
    stopAudio: () => void
    suspendAudio: () => void
  }
}

let initPromise: Promise<void> | null = null
let moduleLoaded = false

/**
 * One AudioContext and one worklet node for the whole tab, shared by every tool.
 * The worklet (`public/worklets/processor.js`) picks its DSP per tool with a mode.
 */
const useAudioEngineStore = create<AudioEngineState>()((set, get) => ({
  ctx: null,
  workletNode: null,
  isRunning: false,
  status: "idle",

  actions: {
    initAudio() {
      initPromise ??= (async () => {
        set({ status: "pending" })

        let { ctx, workletNode } = get()
        ctx ??= new AudioContext()
        set({ ctx })
        if (ctx.state === "running") await ctx.suspend()

        if (!moduleLoaded) {
          await ctx.audioWorklet.addModule("/worklets/processor.js")
          moduleLoaded = true
        }

        if (!workletNode) {
          workletNode = new AudioWorkletNode(ctx, "audio-processor")
          workletNode.connect(ctx.destination)

          // Engine messages: handled here, once, whichever tool is mounted.
          workletNode.port.addEventListener("message", (e: MessageEvent<{ type?: string }>) => {
            if (e.data.type === "AUTO_SUSPEND") get().actions.suspendAudio()
          })
          workletNode.port.start()

          workletNode.addEventListener("processorerror", (e) => {
            console.error("Worklet processor crashed:", e)
            // Keep initPromise: a retry must not report success with this dead node.
            set({ status: "failure", isRunning: false })
          })
        }

        set({ workletNode, status: "success" })
      })().catch((error: unknown) => {
        console.error(error)
        set({ status: "failure" })
        initPromise = null
      })

      return initPromise
    },

    async runAudio() {
      const { ctx, status } = get()
      if (status !== "success") return

      if (ctx?.state === "suspended") await ctx.resume()
      set({ isRunning: true })
    },

    stopAudio() {
      // Always clear it: a stuck isRunning blocks suspendAudio for the whole tab.
      set({ isRunning: false })
    },

    suspendAudio() {
      const { ctx, isRunning } = get()
      // One context for the whole tab: never pull it out from under a running tool.
      if (isRunning) return
      void ctx?.suspend()
    },
  },
}))

export const useWorkletNode = () => useAudioEngineStore((s) => s.workletNode)
export const useAudioStatus = () => useAudioEngineStore((s) => s.status)
export const useAudioActions = () => useAudioEngineStore((s) => s.actions)
