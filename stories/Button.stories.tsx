import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { expect, fireEvent, fn, userEvent, within } from "storybook/test"

import { Button, type ButtonProps } from "@/components/ui/button"

type Tool = NonNullable<ButtonProps["tool"]>

const TOOLS: { tool: Tool; label: string; href: string }[] = [
  { tool: "tuner", label: "Tuner", href: "/tuner" },
  { tool: "ear-training", label: "Guess The Note/Interval/Chord", href: "/ear-training" },
  { tool: "metronome", label: "Metronome", href: "/metronome" },
  { tool: "beat-machine", label: "Beat Machine", href: "/beat-machine" },
  { tool: "about", label: "About", href: "/about" },
]

const meta = {
  title: "Components/Button",
  component: Button,
  args: {
    tool: "tuner",
    children: "Tuner",
  },
  argTypes: {
    tool: {
      control: "inline-radio",
      options: TOOLS.map((t) => t.tool),
    },
  },
  // Figma button copies are 224px wide; stories can override with parameters.width.
  decorators: [
    (Story, { parameters }) => (
      <div className={(parameters.width as string | undefined) ?? "w-56"}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Tuner: Story = {}

/** The longest real label; it wraps to two lines and stays centred. */
export const EarTraining: Story = {
  args: { tool: "ear-training", children: "Guess The Note/Interval/Chord" },
}

export const Metronome: Story = {
  args: { tool: "metronome", children: "Metronome" },
}

export const BeatMachine: Story = {
  args: { tool: "beat-machine", children: "Beat Machine" },
}

export const About: Story = {
  args: { tool: "about", children: "About" },
}

function DisabledDemo({ onClick, ...props }: ButtonProps) {
  const [disabled, setDisabled] = useState(true)

  return (
    <div className="flex flex-col gap-4">
      <Button {...props} disabled={disabled} onClick={onClick} />
      <label className="flex items-center gap-2 text-foreground">
        <input
          type="checkbox"
          checked={disabled}
          onChange={(e) => {
            setDisabled(e.target.checked)
          }}
        />
        Disabled
      </label>
    </div>
  )
}

/** Dimmed, no hover/pressed styling, and not clickable. Toggle the checkbox to switch (instantly) between states. */
export const Disabled: Story = {
  args: { onClick: fn() },
  render: (args) => <DisabledDemo {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole("button", { name: "Tuner" })
    const checkbox = canvas.getByRole("checkbox", { name: "Disabled" })

    await expect(button).toBeDisabled()
    await fireEvent.click(button)
    await expect(args.onClick).not.toHaveBeenCalled()

    await fireEvent.click(checkbox)
    await expect(button).toBeEnabled()
    await fireEvent.click(button)
    await expect(args.onClick).toHaveBeenCalledTimes(1)
    // Restore the initial state: the story must be left disabled.
    await fireEvent.click(checkbox)
    await expect(button).toBeDisabled()
  },
}

/** The SuperTuner menu from Figma (336px wide). Hover, press and Tab through it to check states. */
export const Menu: Story = {
  parameters: { width: "w-84" },
  render: () => (
    <nav aria-label="Tools">
      <ul className="flex flex-col gap-4">
        {TOOLS.map(({ tool, label, href }) => (
          <li key={tool}>
            <Button tool={tool} asChild>
              <a href={href}>{label}</a>
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  ),
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole("navigation", { name: "Tools" })
    const links = within(nav).getAllByRole("link")
    await expect(links).toHaveLength(TOOLS.length)

    for (const link of links) {
      await userEvent.tab()
      await expect(link).toHaveFocus()
    }
  },
}
