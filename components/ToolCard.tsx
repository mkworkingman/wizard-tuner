import { cva, type VariantProps } from "class-variance-authority"
import { ViewTransition } from "react"
import type * as React from "react"

import { cn } from "@/lib/utils"

export type Tool = "tuner" | "ear-training" | "metronome" | "beat-machine" | "about"

/**
 * Shared view-transition name for a tool. The home-page `NavButton` and the
 * tool page's `ToolCard` both use it, so navigating morphs one into the other
 * (CSS in app/globals.css).
 */
export function toolTransitionName(tool: Tool) {
  return `${tool}-card`
}

export const toolCardVariants = cva(
  "flex flex-col gap-4 rounded-control border-2 p-8 text-tool-foreground",
  {
    variants: {
      tool: {
        tuner: "border-tool-tuner bg-tool-tuner-surface",
        "ear-training": "border-tool-ear-training bg-tool-ear-training-surface",
        metronome: "border-tool-metronome bg-tool-metronome-surface",
        "beat-machine": "border-tool-beat-machine bg-tool-beat-machine-surface",
        about: "border-tool-about bg-tool-about-surface",
      },
    },
    defaultVariants: {
      tool: "tuner",
    },
  },
)

export type ToolCardProps = React.ComponentProps<"section"> &
  VariantProps<typeof toolCardVariants> & {
    /** Page heading, rendered as the card's `<h1>`. */
    title: string
  }

/** Main surface of a tool page. Morphs from the matching home-page `NavButton`. */
export function ToolCard({ className, tool, title, children, ...props }: ToolCardProps) {
  const resolvedTool = tool ?? "tuner"

  return (
    <ViewTransition name={toolTransitionName(resolvedTool)} share="morph" default="none">
      <section
        data-slot="tool-card"
        data-tool={resolvedTool}
        aria-label={title}
        className={cn(toolCardVariants({ tool }), className)}
        {...props}
      >
        <h1 className="font-display text-3xl">{title}</h1>
        {children}
      </section>
    </ViewTransition>
  )
}
