import type * as React from "react"

import { StepGrid } from "./StepGrid"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface BeatMachineViewProps {
  isPlaying: boolean
  isReady: boolean
  stepCount: number
  onStart: () => void
  onStop: () => void
  stepGridRef?: React.Ref<HTMLDivElement>
  activeStep?: number
}

/** Presentational beat machine: a Start/Stop toggle above the step grid. */
export function BeatMachineView({
  isPlaying,
  isReady,
  stepCount,
  onStart,
  onStop,
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

      <StepGrid ref={stepGridRef} stepCount={stepCount} activeStep={activeStep} />
    </div>
  )
}
