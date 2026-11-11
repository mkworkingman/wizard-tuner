import { expect, test } from "@playwright/test"

test("home page renders without console errors", async ({ page }) => {
  const errors: string[] = []
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text())
  })
  page.on("pageerror", (err) => errors.push(err.message))

  await page.goto("/")
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()

  expect(errors).toEqual([])
})

test("focus moves to Back home on a tool page and returns to its link on home", async ({
  page,
}) => {
  await page.goto("/")
  const tunerLink = page.getByRole("link", { name: "Tuner", exact: true })

  await tunerLink.click()
  await expect(page).toHaveURL("/tuner")
  await expect(page.getByRole("link", { name: "← Back home" })).toBeFocused()

  await page.getByRole("link", { name: "← Back home" }).click()
  await expect(page).toHaveURL("/")
  await expect(tunerLink).toBeFocused()
})
