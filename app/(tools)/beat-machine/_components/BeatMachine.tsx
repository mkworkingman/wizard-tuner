"use client"

import { BeatMachineView } from "./BeatMachineView"
import { useBeatMachine } from "@/hooks/useBeatMachine"

export function BeatMachine() {
  const { startAudio, stopAudio, stepIndicatorRef, isPlaying, isReady, stepCount } =
    useBeatMachine()

  return (
    <BeatMachineView
      isPlaying={isPlaying}
      isReady={isReady}
      stepCount={stepCount}
      onStart={() => void startAudio()}
      onStop={stopAudio}
      stepGridRef={stepIndicatorRef}
    />
  )
}
