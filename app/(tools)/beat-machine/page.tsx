import type { Metadata } from "next";

import { ToolCard } from "@/components/ToolCard";

import { BeatMachine } from "./_components/BeatMachine";

export const metadata: Metadata = { title: "Beat Machine · Wizard Tuner" };

export default function BeatMachinePage() {
  return (
    <ToolCard tool="beat-machine" title="Beat Machine">
      <BeatMachine />
    </ToolCard>
  );
}
