import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { ToolCard } from "@/components/ToolCard"

const meta = {
  title: "Components/ToolCard",
  component: ToolCard,
  args: {
    tool: "tuner",
    title: "Tuner",
    children: <p>Coming soon.</p>,
  },
  argTypes: {
    tool: {
      control: "inline-radio",
      options: ["tuner", "ear-training", "metronome", "beat-machine", "about"],
    },
  },
} satisfies Meta<typeof ToolCard>

export default meta
type Story = StoryObj<typeof meta>

export const Tuner: Story = {}

export const EarTraining: Story = {
  args: { tool: "ear-training", title: "Guess The Note/Interval/Chord" },
}

export const Metronome: Story = {
  args: { tool: "metronome", title: "Metronome" },
}

export const BeatMachine: Story = {
  args: { tool: "beat-machine", title: "Beat Machine" },
}

export const About: Story = {
  args: { tool: "about", title: "About" },
}
