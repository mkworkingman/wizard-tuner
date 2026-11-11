"use client";

import { useBeatMachine } from "@/hooks/useBeatMachine";

export function BeatMachine() {
  const { startAudio, stopAudio, stepIndicatorRef, isReady, stepCount } = useBeatMachine();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => void startAudio()}
          disabled={!isReady}
          className="rounded-control border-2 border-tool-beat-machine px-4 py-2 outline-foreground focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
        >
          Start
        </button>
        <button
          type="button"
          onClick={stopAudio}
          disabled={!isReady}
          className="rounded-control border-2 border-tool-beat-machine px-4 py-2 outline-foreground focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
        >
          Stop
        </button>
      </div>

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
  );
}
