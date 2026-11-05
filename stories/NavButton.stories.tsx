import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { NavButton, type NavButtonProps } from "@/components/NavButton";

type Tool = NonNullable<NavButtonProps["tool"]>;

const TOOLS: { tool: Tool; label: string; href: string }[] = [
  { tool: "tuner", label: "Tuner", href: "/tuner" },
  { tool: "ear-training", label: "Guess The Note/Interval/Chord", href: "/ear-training" },
  { tool: "metronome", label: "Metronome", href: "/metronome" },
  { tool: "beat-machine", label: "Beat Machine", href: "/beat-machine" },
  { tool: "about", label: "About", href: "/about" },
];

const meta = {
  title: "Components/NavButton",
  component: NavButton,
  args: {
    href: "/tuner",
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
} satisfies Meta<typeof NavButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tuner: Story = {};

/** The longest real label; it wraps to two lines and stays centred. */
export const EarTraining: Story = {
  args: { tool: "ear-training", href: "/ear-training", children: "Guess The Note/Interval/Chord" },
};

export const Metronome: Story = {
  args: { tool: "metronome", href: "/metronome", children: "Metronome" },
};

export const BeatMachine: Story = {
  args: { tool: "beat-machine", href: "/beat-machine", children: "Beat Machine" },
};

export const About: Story = {
  args: { tool: "about", href: "/about", children: "About" },
};

/** The SuperTuner menu from Figma (336px wide). Hover, press and Tab through it to check states. */
export const Menu: Story = {
  parameters: { width: "w-84" },
  render: () => (
    <nav aria-label="Tools">
      <ul className="flex flex-col gap-4">
        {TOOLS.map(({ tool, label, href }) => (
          <li key={tool}>
            <NavButton tool={tool} href={href}>
              {label}
            </NavButton>
          </li>
        ))}
      </ul>
    </nav>
  ),
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole("navigation", { name: "Tools" });
    const links = within(nav).getAllByRole("link");
    await expect(links).toHaveLength(TOOLS.length);

    for (const link of links) {
      await userEvent.tab();
      await expect(link).toHaveFocus();
    }
  },
};
