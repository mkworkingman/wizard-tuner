import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { HeaderNav } from "@/app/(tools)/_components/HeaderNav"

const meta = {
  title: "Components/HeaderNav",
  component: HeaderNav,
  decorators: [
    (Story) => (
      <header className="relative flex items-center justify-between border-b-2 border-border bg-chrome px-4 py-2 md:py-4">
        <span className="font-display text-xl">Wizard Tuner</span>
        <Story />
      </header>
    ),
  ],
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: "/metronome" } },
  },
} satisfies Meta<typeof HeaderNav>

export default meta
type Story = StoryObj<typeof meta>

/** Desktop: the link bar. */
export const Default: Story = {}

/** Mobile: hamburger that opens the side sheet. */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile1", isRotated: false } },
}
