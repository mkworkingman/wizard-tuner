"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

import { rememberToolPath } from "@/lib/last-tool-path"

/**
 * Moves focus to the returned ref's element whenever a tool page is shown, and
 * records the page so home can return focus to the link that led here.
 *
 * Re-runs on every tool page change, and when the route is revealed again
 * (Cache Components keeps it in a hidden <Activity> instead of unmounting).
 */
export function useFocusOnToolPage<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const pathname = usePathname()

  useEffect(() => {
    rememberToolPath(pathname)
    ref.current?.focus()
  }, [pathname])

  return ref
}
