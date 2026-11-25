import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { StepGrid } from "@/app/(tools)/beat-machine/_components/StepGrid"
import { INITIAL_GRID } from "@/hooks/useBeatMachine"

const meta = {
  title: "Components/StepGrid",
  component: StepGrid,
  args: { grid: INITIAL_GRID },
} satisfies Meta<typeof StepGrid>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** The playing step is filled. */
export const ActiveStep: Story = {
  args: { activeStep: 4 },
}
