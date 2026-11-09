import type { Metadata } from "next";

import { ToolCard } from "@/components/ToolCard";

export const metadata: Metadata = { title: "Metronome · Wizard Tuner" };

export default function MetronomePage() {
  return (
    <ToolCard tool="metronome" title="Metronome">
      <p>Coming soon.</p>
    </ToolCard>
  );
}
