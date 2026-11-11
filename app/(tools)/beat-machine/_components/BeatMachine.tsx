"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useBeatMachine } from "@/hooks/useBeatMachine"

export function BeatMachine() {
  const { startAudio, stopAudio, stepIndicatorRef, isPlaying, isReady, stepCount } =
    useBeatMachine()

  return (
    <div className="flex flex-col gap-4">
      <Button
        tool="beat-machine"
        className="w-auto self-start"
        onClick={isPlaying ? stopAudio : () => void startAudio()}
        disabled={!isReady}
      >
        {/* Both labels share one grid cell, so the button is as wide as the longer one and never shifts. */}
        <span className="grid">
          <span className={cn("col-start-1 row-start-1", isPlaying && "invisible")}>Start</span>
          <span className={cn("col-start-1 row-start-1", !isPlaying && "invisible")}>Stop</span>
        </span>
      </Button>

      <div ref={stepIndicatorRef} className="grid grid-cols-8 gap-2 sm:grid-cols-16">
        {Array.from({ length: stepCount }, (_, step) => (
          <div
            key={step}
            data-step={step}
            className="rounded-control border-2 border-tool-beat-machine py-2 text-center data-active:bg-tool-beat-machine"
          >
            {step + 1}
          </div>
        ))}
      </div>
    </div>
  )
}
