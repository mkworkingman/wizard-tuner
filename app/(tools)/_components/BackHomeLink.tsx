"use client"

import Link from "next/link"

import { useFocusOnToolPage } from "@/hooks/useFocusOnToolPage"

/**
 * "Back home" link of the tool pages. Takes focus whenever a tool page is shown,
 * so keyboard and screen-reader users start from it.
 */
export function BackHomeLink() {
  const ref = useFocusOnToolPage<HTMLAnchorElement>()

  return (
    <Link
      ref={ref}
      href="/"
      // Fades in/out with the tool-page chrome (CSS in app/globals.css).
      style={{ viewTransitionName: "tools-back-link" }}
      className="w-fit text-muted-foreground underline-offset-4 focus-ring hover:text-foreground hover:underline"
    >
      ← Back home
    </Link>
  )
}
