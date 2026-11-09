"use client";

import Link from "next/link";
import { useEffect, useRef, ViewTransition } from "react";

import { NavButton } from "@/components/NavButton";
import { type Tool, toolTransitionName } from "@/components/ToolCard";
import { takeToolPath } from "@/lib/last-tool-path";

const LINKS: { tool: Tool; label: string; href: "/tuner" | "/ear-training" | "/metronome" }[] = [
  { tool: "tuner", label: "Tuner", href: "/tuner" },
  { tool: "ear-training", label: "Guess The Note/Interval/Chord", href: "/ear-training" },
  { tool: "metronome", label: "Metronome", href: "/metronome" },
];

/**
 * Home-page menu of tools. When the user comes back from a tool page, focus
 * returns to the link that leads to it.
 */
export function ToolNav() {
  const links = useRef(new Map<string, HTMLAnchorElement>());

  // Re-runs when home is revealed again (Cache Components keeps it in a hidden <Activity>).
  useEffect(() => {
    const path = takeToolPath();
    if (path) links.current.get(path)?.focus();
  }, []);

  return (
    <nav aria-label="Tools" className="w-84 max-w-full">
      <ul className="flex flex-col gap-4">
        {LINKS.map(({ tool, label, href }) => (
          <li key={tool}>
            {/* Shares its name with the tool page's card, so navigating morphs one into the other. */}
            <ViewTransition name={toolTransitionName(tool)} share="morph" default="none">
              <NavButton tool={tool} asChild>
                <Link
                  ref={(node) => {
                    if (node) links.current.set(href, node);
                    else links.current.delete(href);
                  }}
                  href={href}
                >
                  {label}
                </Link>
              </NavButton>
            </ViewTransition>
          </li>
        ))}
      </ul>
    </nav>
  );
}
