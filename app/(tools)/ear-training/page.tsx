import type { Metadata } from "next";

import { ToolCard } from "@/components/ToolCard";

export const metadata: Metadata = { title: "Guess The Note/Interval/Chord · Wizard Tuner" };

export default function EarTrainingPage() {
  return (
    <ToolCard tool="ear-training" title="Guess The Note/Interval/Chord">
      <p>Coming soon.</p>
    </ToolCard>
  );
}
