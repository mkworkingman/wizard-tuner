import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect } from "storybook/test"

import { NavLinks } from "@/components/NavLinks"

const meta = {
  title: "Components/NavLinks",
  component: NavLinks,
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: "/metronome" } },
  },
} satisfies Meta<typeof NavLinks>

export default meta
type Story = StoryObj<typeof meta>

/** Header bar: tabs with slanted dividers. */
export const Horizontal: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Metronome" })).toHaveAttribute(
      "aria-current",
      "page",
    )
  },
}

/** Stacked list, as in the mobile sheet. */
export const Vertical: Story = {
  args: { orientation: "vertical" },
}
