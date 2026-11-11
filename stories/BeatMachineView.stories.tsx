import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn, userEvent } from "storybook/test"

import { BeatMachineView } from "@/app/(tools)/beat-machine/_components/BeatMachineView"

const meta = {
  title: "Components/BeatMachineView",
  component: BeatMachineView,
  args: {
    isPlaying: false,
    isReady: true,
    stepCount: 16,
    onStart: fn(),
    onStop: fn(),
  },
} satisfies Meta<typeof BeatMachineView>

export default meta
type Story = StoryObj<typeof meta>

export const Stopped: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Start" }))
    await expect(args.onStart).toHaveBeenCalledOnce()
    await expect(args.onStop).not.toHaveBeenCalled()
  },
}

export const Playing: Story = {
  args: { isPlaying: true, activeStep: 4 },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Stop" }))
    await expect(args.onStop).toHaveBeenCalledOnce()
    await expect(args.onStart).not.toHaveBeenCalled()
  },
}

export const NotReady: Story = {
  args: { isReady: false },
  play: async ({ canvas, args }) => {
    const button = canvas.getByRole("button", { name: "Start" })
    await expect(button).toBeDisabled()
    await userEvent.click(button)
    await expect(args.onStart).not.toHaveBeenCalled()
  },
}
