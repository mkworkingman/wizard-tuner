import Link from "next/link";
import { ViewTransition } from "react";

import { NavButton } from "@/components/NavButton";
import { type Tool, toolTransitionName } from "@/components/ToolCard";

const LINKS: { tool: Tool; label: string; href: "/tuner" | "/ear-training" | "/metronome" }[] = [
  { tool: "tuner", label: "Tuner", href: "/tuner" },
  { tool: "ear-training", label: "Guess The Note/Interval/Chord", href: "/ear-training" },
  { tool: "metronome", label: "Metronome", href: "/metronome" },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-24">
      <h1 className="sr-only">Wizard Tuner</h1>
      <nav aria-label="Tools" className="w-84 max-w-full">
        <ul className="flex flex-col gap-4">
          {LINKS.map(({ tool, label, href }) => (
            <li key={tool}>
              {/* Shares its name with the tool page's card, so navigating morphs one into the other. */}
              <ViewTransition name={toolTransitionName(tool)} share="morph" default="none">
                <NavButton tool={tool} asChild>
                  <Link href={href}>{label}</Link>
                </NavButton>
              </ViewTransition>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
