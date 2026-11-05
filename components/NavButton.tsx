import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Menu entry that leads to a tool. Each tool has its own colour family; the
 * surface matches the destination page's background.
 *
 * States: hover = vertical gradient into the tinted base; pressed (`:active`) =
 * inset shading.
 *
 * The gradient is always on, flat at rest (both stops = surface). Hover only moves
 * the bottom stop; Tailwind registers --tw-gradient-to as a <color>, so it animates.
 * (background-image itself can't transition.)
 *
 * Colours come from the tool tokens in app/globals.css (dark theme only for now).
 */
export const navButtonVariants = cva(
  [
    "flex min-h-14 w-full items-center justify-center rounded-control border-2 px-4 py-2",
    "text-center font-display text-xl leading-6 text-tool-foreground",
    "bg-linear-to-b transition outline-none motion-reduce:transition-none",
    "active:inset-shadow-pressed",
    "focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  ],
  {
    variants: {
      tool: {
        tuner: [
          "border-tool-tuner bg-tool-tuner-surface",
          "from-tool-tuner-surface to-tool-tuner-surface hover:to-tool-tuner-hover",
        ],
        "ear-training": [
          "border-tool-ear-training bg-tool-ear-training-surface",
          "from-tool-ear-training-surface to-tool-ear-training-surface hover:to-tool-ear-training-hover",
        ],
        metronome: [
          "border-tool-metronome bg-tool-metronome-surface",
          "from-tool-metronome-surface to-tool-metronome-surface hover:to-tool-metronome-hover",
        ],
        "beat-machine": [
          "border-tool-beat-machine bg-tool-beat-machine-surface",
          "from-tool-beat-machine-surface to-tool-beat-machine-surface hover:to-tool-beat-machine-hover",
        ],
        about: [
          "border-tool-about bg-tool-about-surface",
          "from-tool-about-surface to-tool-about-surface hover:to-tool-about-hover",
        ],
      },
    },
    defaultVariants: {
      tool: "tuner",
    },
  },
);

export type NavButtonProps = React.ComponentProps<"a"> &
  VariantProps<typeof navButtonVariants> & {
    /** Render the child element (e.g. Next.js `<Link>`) instead of an `<a>`. */
    asChild?: boolean;
  };

export function NavButton({ className, tool, asChild = false, ...props }: NavButtonProps) {
  const Comp = asChild ? Slot.Root : "a";

  return (
    <Comp
      data-slot="nav-button"
      data-tool={tool ?? "tuner"}
      className={cn(navButtonVariants({ tool }), className)}
      {...props}
    />
  );
}
