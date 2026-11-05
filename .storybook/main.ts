import type { StorybookConfig } from "@storybook/nextjs-vite";
import tailwindcss from "@tailwindcss/vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "storybook-addon-pseudo-states",
  ],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
  // The Next app compiles Tailwind through the @tailwindcss/turbopack loader
  // (next.config.ts). Storybook builds with Vite, so it needs the Vite plugin.
  viteFinal(config) {
    config.plugins = [...(config.plugins ?? []), tailwindcss()];
    return config;
  },
};

export default config;
