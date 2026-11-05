import type { Preview } from "@storybook/nextjs-vite";

import { fontVariables } from "../app/fonts";
import "../app/globals.css";

// Same font CSS variables the root layout sets on <html>.
document.documentElement.classList.add(...fontVariables.split(" "));

const preview: Preview = {
  parameters: {
    layout: "centered",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // Any axe (WCAG) violation fails the story test in Vitest and CI.
      test: "error",
    },
  },
  // Dark theme only for now: the tokens in app/globals.css are the dark values.
  decorators: [
    (Story) => (
      <div className="p-6">
        <Story />
      </div>
    ),
  ],
};

export default preview;
