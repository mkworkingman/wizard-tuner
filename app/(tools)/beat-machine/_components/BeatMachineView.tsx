import type * as React from "react"

import { StepGrid } from "./StepGrid"
import { Slider } from "@/components/Slider"
import { Button } from "@/components/ui/button"
import { MAX_BPM, MIN_BPM, type BeatGrid } from "@/hooks/useBeatMachine"
import { cn } from "@/lib/utils"

export type BeatMachineViewProps = {
  isPlaying: boolean
  isReady: boolean
  grid: BeatGrid
  bpm: number
  onBpmChange: (bpm: number) => void
  onStart: () => void
  onStop: () => void
  onToggleStep?: (instrument: string, step: number) => void
  stepGridRef?: React.Ref<HTMLDivElement>
  activeStep?: number
}

/** Presentational beat machine: a Start/Stop toggle above the step grid. */
export function BeatMachineView({
  isPlaying,
  isReady,
  grid,
  bpm,
  onBpmChange,
  onStart,
  onStop,
  onToggleStep,
  stepGridRef,
  activeStep,
}: BeatMachineViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <Button
        tool="beat-machine"
        className="w-auto self-start"
        onClick={isPlaying ? onStop : onStart}
        disabled={!isReady}
      >
        {/* Both labels share one grid cell, so the button is as wide as the longer one and never shifts. */}
        <span className="grid">
          <span className={cn("col-start-1 row-start-1", isPlaying && "invisible")}>Start</span>
          <span className={cn("col-start-1 row-start-1", !isPlaying && "invisible")}>Stop</span>
        </span>
      </Button>

      <Slider
        label={`Tempo: ${String(bpm)} BPM`}
        value={bpm}
        min={MIN_BPM}
        max={MAX_BPM}
        onChange={onBpmChange}
      />

      <StepGrid ref={stepGridRef} grid={grid} activeStep={activeStep} onToggleStep={onToggleStep} />
    </div>
  )
}
