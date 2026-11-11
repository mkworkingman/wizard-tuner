import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect } from "storybook/test"

import { BackHomeLink } from "@/app/(tools)/_components/BackHomeLink"
import { takeToolPath } from "@/lib/last-tool-path"

const meta = {
  title: "Components/BackHomeLink",
  component: BackHomeLink,
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: "/tuner" } },
  },
} satisfies Meta<typeof BackHomeLink>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: /back home/i })
    await expect(link).toHaveFocus()
    await expect(link).toHaveAttribute("href", "/")
    await expect(takeToolPath()).toBe("/tuner")
    // Verified; don't leave the link focused in the Storybook canvas.
    link.blur()
  },
}
