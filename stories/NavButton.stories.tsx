import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Link from "next/link";
import { STORY_RENDERED } from "storybook/internal/core-events";
import { addons } from "storybook/preview-api";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { NavButton, type NavButtonProps } from "@/components/NavButton";

type Tool = NonNullable<NavButtonProps["tool"]>;

const TOOLS: { tool: Tool; label: string; href: string }[] = [
  { tool: "tuner", label: "Tuner", href: "/tuner" },
  { tool: "ear-training", label: "Guess The Note/Interval/Chord", href: "/ear-training" },
  { tool: "metronome", label: "Metronome", href: "/metronome" },
  { tool: "beat-machine", label: "Beat Machine", href: "/beat-machine" },
  { tool: "about", label: "About", href: "/about" },
];

const STATES = ["default", "hover", "pressed"] as const;

// Hover, pressed and focus-visible are CSS pseudo-classes, which play's synthetic
// events can't trigger. storybook-addon-pseudo-states forces them: it rewrites
// :hover/:active/:focus-visible rules into .pseudo-* classes and adds those classes
// to elements under the story root.
// - rootSelector: the addon looks for #storybook-root, which only exists in the
//   Storybook UI, and resolves it once before the story renders. <body> exists in
//   both the Storybook UI and Vitest.
// - The addon rewrites stylesheets on STORY_RENDERED, which Vitest's portable
//   stories never emit. applyPseudoStates() emits it once when nothing was rewritten.
const PSEUDO_ROOT = "body";

const applyPseudoStates = () => {
  const rewritten = Array.from(document.styleSheets).some((sheet) => {
    try {
      return Array.from(sheet.cssRules).some((rule) => rule.cssText.includes(".pseudo-"));
    } catch {
      return false;
    }
  });
  if (!rewritten) addons.getChannel().emit(STORY_RENDERED);
};

const gradientStops = (el: HTMLElement) => {
  const style = getComputedStyle(el);
  return {
    from: style.getPropertyValue("--tw-gradient-from"),
    to: style.getPropertyValue("--tw-gradient-to"),
  };
};

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
  parameters: { pseudo: { rootSelector: PSEUDO_ROOT } },
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

export const Tuner: Story = {
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "Tuner" });
    await expect(link).toHaveAttribute("href", "/tuner");

    const style = getComputedStyle(link);
    await expect(style.color).toBe("oklch(1 0 0)");
    // Figma teal surface #062020 / outline #008b83.
    await expect(style.backgroundColor).toBe("oklch(0.224 0.032 195.1)");
    await expect(style.borderTopColor).toBe("oklch(0.574 0.1 187.7)");
    await expect(style.fontFamily).toContain("Montserrat");

    // At rest: flat gradient (both stops = surface) and no inset shading.
    const { from, to } = gradientStops(link);
    await expect(to).toBe(from);
    await expect(style.boxShadow).not.toContain("inset");

    await userEvent.tab();
    await expect(link).toHaveFocus();
  },
};

export const EarTraining: Story = {
  args: { tool: "ear-training", href: "/ear-training", children: "Ear training" },
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

/** Hover moves the gradient's bottom stop toward the accent. */
export const Hover: Story = {
  parameters: { pseudo: { rootSelector: PSEUDO_ROOT, hover: true } },
  play: async ({ canvas }) => {
    applyPseudoStates();
    const link = canvas.getByRole("link", { name: "Tuner" });
    await waitFor(async () => {
      const { from, to } = gradientStops(link);
      await expect(to).not.toBe(from);
    });
    await expect(getComputedStyle(link).boxShadow).not.toContain("inset");
  },
};

/** Pressed (`:active`) shows the inset white shading. */
export const Pressed: Story = {
  parameters: { pseudo: { rootSelector: PSEUDO_ROOT, active: true } },
  play: async ({ canvas }) => {
    applyPseudoStates();
    const link = canvas.getByRole("link", { name: "Tuner" });
    await waitFor(() => expect(getComputedStyle(link).boxShadow).toContain("inset"));
  },
};

/** Keyboard focus shows a ring outside the outline. */
export const FocusVisible: Story = {
  parameters: { pseudo: { rootSelector: PSEUDO_ROOT, focusVisible: true } },
  play: async ({ canvas }) => {
    applyPseudoStates();
    const link = canvas.getByRole("link", { name: "Tuner" });
    // ring-2 + ring-offset-2 → a 4px spread shadow layer.
    await waitFor(() => expect(getComputedStyle(link).boxShadow).toContain("0px 0px 0px 4px"));
  },
};

/** Hover and pressed animate (300ms) instead of snapping. */
export const Transitions: Story = {
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "Tuner" });
    const style = getComputedStyle(link);
    // background-image can't transition, so the gradient animates through its
    // registered stop colour; box-shadow covers the pressed shading.
    await expect(style.transitionProperty).toContain("--tw-gradient-to");
    await expect(style.transitionProperty).toContain("box-shadow");
    await expect(style.transitionDuration.split(",")[0]).toBe("0.3s");
  },
};

/** Labels wider than the button wrap and stay centred. */
export const LongLabel: Story = {
  args: {
    tool: "ear-training",
    href: "/ear-training",
    children: "Guess The Note/Interval/Chord",
  },
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "Guess The Note/Interval/Chord" });
    await expect(link.scrollWidth).toBeLessThanOrEqual(link.clientWidth);
  },
};

/** `asChild` renders a Next.js `<Link>` with the button's styling. */
export const AsNextLink: Story = {
  render: ({ children, href, ...args }) => (
    <NavButton {...args} asChild>
      <Link href={href ?? "/"}>{children}</Link>
    </NavButton>
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "Tuner" });
    await expect(link).toHaveAttribute("data-slot", "nav-button");
    await expect(link).toHaveAttribute("href", "/tuner");
  },
};

/** Every tool in every state, like the Figma button matrix. */
export const AllVariants: Story = {
  parameters: {
    width: "w-max",
    pseudo: {
      rootSelector: PSEUDO_ROOT,
      hover: ['[data-preview="hover"]'],
      active: ['[data-preview="pressed"]'],
    },
  },
  render: () => (
    <table className="border-separate border-spacing-4 text-left">
      <caption className="text-left text-foreground">NavButton: every tool and state</caption>
      <thead>
        <tr>
          <th scope="col">Tool</th>
          {STATES.map((state) => (
            <th key={state} scope="col" className="capitalize">
              {state}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {TOOLS.map(({ tool, label, href }) => (
          <tr key={tool} data-tool-row={tool}>
            <th scope="row" className="font-normal">
              {tool}
            </th>
            {STATES.map((state) => (
              <td key={state} className="w-56">
                <NavButton tool={tool} href={href} data-preview={state}>
                  {label}
                </NavButton>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
  play: async ({ canvasElement }) => {
    applyPseudoStates();
    const table = within(canvasElement).getByRole("table");

    for (const { tool, label } of TOOLS) {
      const row = table.querySelector<HTMLElement>(`[data-tool-row="${tool}"]`);
      if (!row) throw new Error(`Missing row for ${tool}`);
      const [rest, hovered, pressed] = within(row).getAllByRole("link", { name: label });

      await expect(rest).toHaveAttribute("data-tool", tool);
      await expect(getComputedStyle(rest).color).toBe("oklch(1 0 0)");

      // Default: flat, no shading.
      const restStops = gradientStops(rest);
      await expect(restStops.to).toBe(restStops.from);
      await expect(getComputedStyle(rest).boxShadow).not.toContain("inset");

      // Hover: gradient toward the accent, no shading.
      await waitFor(async () => {
        const { from, to } = gradientStops(hovered);
        await expect(to).not.toBe(from);
      });
      await expect(getComputedStyle(hovered).boxShadow).not.toContain("inset");

      // Pressed: inset shading.
      await waitFor(() => expect(getComputedStyle(pressed).boxShadow).toContain("inset"));
    }

    // Each tool has its own surface.
    const surfaces = TOOLS.map(({ tool }) => {
      const link = table.querySelector<HTMLElement>(`[data-tool-row="${tool}"] a`);
      return link ? getComputedStyle(link).backgroundColor : "";
    });
    await expect(new Set(surfaces).size).toBe(TOOLS.length);
  },
};

/** The SuperTuner menu from Figma (336px wide). */
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
