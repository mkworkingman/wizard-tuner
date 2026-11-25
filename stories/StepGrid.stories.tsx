import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { StepGrid } from "@/app/(tools)/beat-machine/_components/StepGrid"
import { expect, fireEvent, fn, within } from "storybook/test"
import { INITIAL_GRID } from "@/hooks/useBeatMachine"

const meta = {
  title: "Components/StepGrid",
  component: StepGrid,
  args: { grid: INITIAL_GRID },
} satisfies Meta<typeof StepGrid>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { onToggleStep: fn() },
  play: async ({ canvas, args }) => {
    const kick = within(canvas.getByRole("group", { name: "kick" }))
    await fireEvent.click(kick.getByRole("button", { name: "Step 2" }))
    await expect(args.onToggleStep).toHaveBeenCalledOnce()
    await expect(args.onToggleStep).toHaveBeenCalledWith("kick", 1)
  },
}

/** The playing step is filled. */
export const ActiveStep: Story = {
  args: { activeStep: 4 },
}
