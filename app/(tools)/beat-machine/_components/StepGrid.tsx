import type * as React from "react"

import type { BeatGrid } from "@/hooks/useBeatMachine"

export type StepGridProps = {
  /** One row per instrument; a non-zero value is a hit on that step. */
  grid: BeatGrid
  /** Marks one step column as playing. Static rendering only: at runtime the hook sets `data-active` through `ref`. */
  activeStep?: number
  /** Called when a cell is clicked to enable or disable that hit. */
  onToggleStep?: (instrument: string, step: number) => void
  ref?: React.Ref<HTMLDivElement>
}

/**
 * One row per instrument, one cell per step. Filled cells are hits and toggle on click. Every
 * cell carries `data-step` so the playing column can be marked without re-rendering.
 */
export function StepGrid({ grid, activeStep, onToggleStep, ref }: StepGridProps) {
  return (
    <div ref={ref} data-slot="step-grid" className="flex flex-col gap-2">
      {Object.entries(grid).map(([instrument, steps]) => (
        <div
          key={instrument}
          role="group"
          aria-label={instrument}
          className="flex items-center gap-2"
        >
          <span className="w-16 shrink-0 text-sm capitalize">{instrument}</span>
          <div className="flex flex-1 gap-1">
            {steps.map((hit, step) => (
              <button
                key={step}
                type="button"
                aria-label={`Step ${String(step + 1)}`}
                aria-pressed={hit !== 0}
                onClick={() => onToggleStep?.(instrument, step)}
                data-step={step}
                data-hit={hit ? "" : undefined}
                data-active={step === activeStep ? "" : undefined}
                className="h-8 flex-1 cursor-pointer rounded-control border-2 border-tool-beat-machine focus-ring data-hit:bg-tool-beat-machine/40 data-active:border-foreground data-active:data-hit:bg-tool-beat-machine"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
