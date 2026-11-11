"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

import { rememberToolPath } from "@/lib/last-tool-path"

/**
 * "Back home" link of the tool pages. Takes focus whenever a tool page is shown,
 * so keyboard and screen-reader users start from it, and records the page so
 * home can return focus to the link that led here.
 */
export function BackHomeLink() {
  const ref = useRef<HTMLAnchorElement>(null)
  const pathname = usePathname()

  // Re-runs on every tool page change, and when the route is revealed again
  // (Cache Components keeps it in a hidden <Activity> instead of unmounting).
  useEffect(() => {
    rememberToolPath(pathname)
    ref.current?.focus()
  }, [pathname])

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
