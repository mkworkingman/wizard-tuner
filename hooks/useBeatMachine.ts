import { useEffect, useRef, useState } from "react"

import { useAudioActions, useAudioStatus, useWorkletNode } from "@/store/audio-engine"

export type BeatGrid = Record<string, number[]>

const INITIAL_GRID: BeatGrid = {
  kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  hats: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  crash: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
}
const GRID_LENGTH = 16
const INITIAL_BPM = 120
const STEPS_PER_BEAT = 4

/**
 * Drives the beat machine on the shared audio worklet. The playing step is
 * marked with `data-active` straight on the DOM (no React re-render per tick),
 * on the child of `stepIndicatorRef` whose `data-step` matches.
 */
export function useBeatMachine() {
  const actions = useAudioActions()
  const status = useAudioStatus()
  const workletNode = useWorkletNode()
  const [isPlaying, setIsPlaying] = useState(false)
  const currentStepRef = useRef(0)
  const stepIndicatorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void actions.initAudio()

    const port = workletNode?.port
    if (!port) return

    const indicator = stepIndicatorRef.current
    const setActive = (step: number, active: boolean) => {
      const cell = indicator?.querySelector(`[data-step="${String(step)}"]`)
      if (active) cell?.setAttribute("data-active", "")
      else cell?.removeAttribute("data-active")
    }

    const handleMessage = (e: MessageEvent<{ type?: string; step?: number }>) => {
      if (e.data.type !== "TICK" || typeof e.data.step !== "number") return
      setActive(currentStepRef.current, false)
      setActive(e.data.step, true)
      currentStepRef.current = e.data.step
    }

    port.addEventListener("message", handleMessage)
    port.start()

    // The node is shared and READY fires once per tab: send the full config
    // on every mount, the processor may still hold another tool's state.
    port.postMessage({
      type: "INIT_GRID",
      payload: { grid: INITIAL_GRID, gridLength: GRID_LENGTH, stepsPerBeat: STEPS_PER_BEAT },
    })
    port.postMessage({ type: "SET_BPM", payload: INITIAL_BPM })

    return () => {
      port.postMessage({ type: "STOP" })
      actions.stopAudio()
      actions.suspendAudio()
      port.removeEventListener("message", handleMessage)
      setActive(currentStepRef.current, false)
      currentStepRef.current = 0
    }
  }, [actions, workletNode])

  const startAudio = async () => {
    await actions.runAudio()
    workletNode?.port.postMessage({ type: "START" })
    setIsPlaying(true)
  }

  const stopAudio = () => {
    actions.stopAudio()
    workletNode?.port.postMessage({ type: "STOP" })
    setIsPlaying(false)
  }

  return {
    startAudio,
    stopAudio,
    stepIndicatorRef,
    isPlaying,
    isReady: status === "success",
    stepCount: GRID_LENGTH,
  }
}
