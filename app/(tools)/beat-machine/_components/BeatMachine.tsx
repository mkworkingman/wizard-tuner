"use client"

import { BeatMachineView } from "./BeatMachineView"
import { useBeatMachine } from "@/hooks/useBeatMachine"

export function BeatMachine() {
  const { startAudio, stopAudio, toggleStep, stepIndicatorRef, isPlaying, isReady, grid } =
    useBeatMachine()

  return (
    <BeatMachineView
      isPlaying={isPlaying}
      isReady={isReady}
      grid={grid}
      onStart={() => void startAudio()}
      onStop={stopAudio}
      onToggleStep={toggleStep}
      stepGridRef={stepIndicatorRef}
    />
  )
}
