"use client"

import { BeatMachineView } from "./BeatMachineView"
import { useBeatMachine } from "@/hooks/useBeatMachine"

export function BeatMachine() {
  const {
    startAudio,
    stopAudio,
    toggleStep,
    setBpm,
    bpm,
    stepIndicatorRef,
    isPlaying,
    isReady,
    grid,
  } = useBeatMachine()

  return (
    <BeatMachineView
      isPlaying={isPlaying}
      isReady={isReady}
      grid={grid}
      bpm={bpm}
      onBpmChange={setBpm}
      onStart={() => void startAudio()}
      onStop={stopAudio}
      onToggleStep={toggleStep}
      stepGridRef={stepIndicatorRef}
    />
  )
}
