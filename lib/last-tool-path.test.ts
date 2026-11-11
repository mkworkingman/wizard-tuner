import { describe, expect, it } from "vitest"

import { rememberToolPath, takeToolPath } from "@/lib/last-tool-path"

describe("last tool path", () => {
  it("returns null when nothing was remembered", () => {
    expect(takeToolPath()).toBeNull()
  })

  it("returns the latest remembered path once", () => {
    rememberToolPath("/tuner")
    rememberToolPath("/metronome")
    expect(takeToolPath()).toBe("/metronome")
    expect(takeToolPath()).toBeNull()
  })
})
