import { readFileSync } from "node:fs"
import path from "node:path"

import { expect, test } from "@playwright/test"

import { ROUTES } from "./routes"

// Core Web Vitals "good" thresholds. INP is not asserted here: it needs real user
// interactions to be meaningful. Lighthouse TBT is the lab proxy; field INP comes from
// app/_components/WebVitals.tsx.
const LCP_MAX_MS = 2500
const CLS_MAX = 0.1

// The IIFE build is not in the package "exports", so resolve it next to the main entry.
// It declares `var webVitals`, which Playwright's init-script wrapper keeps local, so the
// collector is appended to the same script instead of relying on a global.
const WEB_VITALS_IIFE = readFileSync(
  path.join(path.dirname(require.resolve("web-vitals")), "web-vitals.iife.js"),
  "utf8",
)
const COLLECTOR = `
  window.__vitals = {};
  const record = (m) => { window.__vitals[m.name] = m.value; };
  webVitals.onLCP(record, { reportAllChanges: true });
  webVitals.onCLS(record, { reportAllChanges: true });
`

declare global {
  interface Window {
    __vitals: Partial<Record<string, number>>
  }
}

for (const route of ROUTES) {
  test(`${route} meets LCP and CLS budgets`, async ({ page }) => {
    await page.addInitScript({ content: `${WEB_VITALS_IIFE}\n${COLLECTOR}` })

    await page.goto(route, { waitUntil: "networkidle" })
    // LCP is finalised on the first user input; simulate one.
    await page.mouse.click(1, 1)

    await expect.poll(() => page.evaluate(() => window.__vitals.LCP)).toBeDefined()
    const vitals = await page.evaluate(() => window.__vitals)

    expect(vitals.LCP ?? Number.POSITIVE_INFINITY, "LCP (ms)").toBeLessThan(LCP_MAX_MS)
    expect(vitals.CLS ?? 0, "CLS").toBeLessThan(CLS_MAX)
  })
}
