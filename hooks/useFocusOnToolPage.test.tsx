import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useFocusOnToolPage } from "@/hooks/useFocusOnToolPage"
import { takeToolPath } from "@/lib/last-tool-path"

const pathname = vi.hoisted(() => ({ current: "/tuner" }))
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }))

function attach(element: HTMLElement, ref: { current: HTMLElement | null }) {
  document.body.append(element)
  ref.current = element
}

describe("useFocusOnToolPage", () => {
  beforeEach(() => {
    pathname.current = "/tuner"
    document.body.replaceChildren()
    takeToolPath()
  })

  it("records the current path", () => {
    renderHook(() => useFocusOnToolPage<HTMLAnchorElement>())
    expect(takeToolPath()).toBe("/tuner")
  })

  it("focuses the element when the page changes", () => {
    const link = document.createElement("a")
    link.href = "/"
    const { result, rerender } = renderHook(() => useFocusOnToolPage<HTMLAnchorElement>())
    attach(link, result.current)
    expect(document.activeElement).not.toBe(link)

    pathname.current = "/metronome"
    rerender()

    expect(document.activeElement).toBe(link)
    expect(takeToolPath()).toBe("/metronome")
  })

  it("does nothing when no element is attached", () => {
    expect(() => renderHook(() => useFocusOnToolPage<HTMLAnchorElement>())).not.toThrow()
  })
})
