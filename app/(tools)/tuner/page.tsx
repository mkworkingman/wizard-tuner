import type { Metadata } from "next";

import { ToolCard } from "@/components/ToolCard";

export const metadata: Metadata = { title: "Tuner · Wizard Tuner" };

export default function TunerPage() {
  return (
    <ToolCard tool="tuner" title="Tuner">
      <p>Coming soon.</p>
    </ToolCard>
  );
}
