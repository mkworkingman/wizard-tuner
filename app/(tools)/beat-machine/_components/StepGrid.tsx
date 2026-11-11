import type * as React from "react"

export interface StepGridProps {
  stepCount: number
  /** Marks one step as playing. Static rendering only: at runtime the hook sets `data-active` through `ref`. */
  activeStep?: number
  ref?: React.Ref<HTMLDivElement>
}

/** One cell per sequencer step. Each cell carries `data-step` so the playing step can be marked without re-rendering. */
export function StepGrid({ stepCount, activeStep, ref }: StepGridProps) {
  return (
    <div ref={ref} data-slot="step-grid" className="grid grid-cols-8 gap-2 sm:grid-cols-16">
      {Array.from({ length: stepCount }, (_, step) => (
        <div
          key={step}
          data-step={step}
          data-active={step === activeStep ? "" : undefined}
          className="rounded-control border-2 border-tool-beat-machine py-2 text-center data-active:bg-tool-beat-machine"
        >
          {step + 1}
        </div>
      ))}
    </div>
  )
}
