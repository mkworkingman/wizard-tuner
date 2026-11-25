import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fireEvent, fn } from "storybook/test"

import { Slider } from "@/components/Slider"

const meta = {
  title: "Components/Slider",
  component: Slider,
  args: { label: "Tempo: 120 BPM", value: 120, min: 40, max: 240, onChange: fn() },
} satisfies Meta<typeof Slider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, args }) => {
    const slider = canvas.getByRole("slider", { name: /tempo/i })
    await expect(slider).toHaveValue("120")
    await expect(slider).toHaveAttribute("min", "40")
    await expect(slider).toHaveAttribute("max", "240")
    await fireEvent.change(slider, { target: { value: "150" } })
    await expect(args.onChange).toHaveBeenCalledWith(150)
  },
}
